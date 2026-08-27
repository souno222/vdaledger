package in.sounodip.vdaledger.ingestion;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.ledger.LedgerEventDraft;
import in.sounodip.vdaledger.ledger.LedgerEventType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Parses CoinDCX Insta and INR-settled Spot trade-report rows.
 *
 * <p>Non-INR pairs are deliberately rejected because a crypto-to-crypto trade
 * requires both an acquisition and a disposal, which the current one-event
 * BUY/SELL ledger model cannot represent accurately.</p>
 */
@Component
public class CoinDcxCsvStrategy implements ExchangeCsvStrategy {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final Pattern PAIR_SEPARATOR = Pattern.compile("[/\\-_\\s]");
    private static final Pattern ASSET_SYMBOL = Pattern.compile("[A-Z0-9]{1,30}");

    private static final List<String> TIMESTAMP_HEADERS = List.of(
            "Trade Completion Time",
            "Trade Completion",
            "Transaction Time",
            "Timestamp"
    );
    private static final List<String> PAIR_HEADERS = List.of(
            "Crypto Pair",
            "Trading Pair",
            "Pair",
            "Market"
    );
    private static final List<String> CRYPTO_HEADERS = List.of(
            "Crypto",
            "Asset",
            "Currency"
    );
    private static final List<String> SIDE_HEADERS = List.of(
            "Side (Buy/Sell)",
            "Side",
            "Order Type (Buy/Sell)",
            "Order Type"
    );
    private static final List<String> PRICE_HEADERS = List.of(
            "Avg Buying/Selling Price (INR)",
            "Average Buying/Selling Price (INR)",
            "Average Buying/Selling Price",
            "Average Price",
            "Price"
    );
    private static final List<String> QUANTITY_HEADERS = List.of(
            "Quantity",
            "Executed Quantity",
            "Total Quantity Executed"
    );
    private static final List<String> GROSS_AMOUNT_HEADERS = List.of(
            "Gross Amount Paid/Received (INR)",
            "Gross Amount (INR)",
            "Gross Amount",
            "Transaction Value (INR)",
            "Transaction Value"
    );
    private static final List<String> FEE_HEADERS = List.of(
            "Fees (INR)",
            "Trading Fees Paid (INR)",
            "Trading Fees Paid",
            "Fees",
            "Fee"
    );
    private static final List<String> TDS_HEADERS = List.of(
            "TDS (INR)",
            "TDS Deducted (INR)",
            "TDS Deducted"
    );
    private static final List<String> TRADE_ID_HEADERS = List.of(
            "Trade ID",
            "Trade Id",
            "Transaction ID",
            "Transaction Id"
    );
    private static final List<String> ORDER_ID_HEADERS = List.of(
            "Order ID",
            "Order Id"
    );
    private static final List<String> SETTLEMENT_CURRENCY_HEADERS = List.of(
            "Base Currency",
            "Quote Currency",
            "Settlement Currency"
    );

    private static final List<DateTimeFormatter> LOCAL_TIMESTAMP_FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            strictFormatter("uuuu-MM-dd HH:mm:ss"),
            strictFormatter("dd-MM-uuuu HH:mm:ss"),
            strictFormatter("dd/MM/uuuu HH:mm:ss"),
            strictFormatter("dd-MM-uuuu hh:mm:ss a"),
            strictFormatter("dd/MM/uuuu hh:mm:ss a")
    );

    @Override
    public ExchangeType supportedExchange() {
        return ExchangeType.COINDCX;
    }

    @Override
    public LedgerEventDraft parse(
            Map<String, String> row,
            long rowNumber,
            UUID userId,
            UUID ingestionJobId
    ) {
        Map<String, String> normalized = normalizeRow(row);
        String timestampValue = requiredAny(normalized, TIMESTAMP_HEADERS, rowNumber);
        String sideValue = requiredAny(normalized, SIDE_HEADERS, rowNumber);
        String priceValue = requiredAny(normalized, PRICE_HEADERS, rowNumber);
        String quantityValue = requiredAny(normalized, QUANTITY_HEADERS, rowNumber);
        String grossAmountValue = requiredAny(normalized, GROSS_AMOUNT_HEADERS, rowNumber);
        String tradeId = requiredAny(normalized, TRADE_ID_HEADERS, rowNumber);

        String pairValue = firstPresent(normalized, PAIR_HEADERS);
        String cryptoValue = firstPresent(normalized, CRYPTO_HEADERS);
        String settlementCurrency = firstPresent(normalized, SETTLEMENT_CURRENCY_HEADERS);
        AssetDetails asset = parseAsset(pairValue, cryptoValue, settlementCurrency, rowNumber);
        LedgerEventType eventType = parseSide(sideValue, rowNumber);
        Instant occurredAt = parseTimestamp(timestampValue, rowNumber);

        BigDecimal price = parseDecimal(priceValue, true, rowNumber);
        BigDecimal quantity = parseDecimal(quantityValue, true, rowNumber);
        BigDecimal grossValueInr = parseDecimal(grossAmountValue, true, rowNumber);
        BigDecimal feeInr = parseOptionalDecimal(normalized, FEE_HEADERS, rowNumber);
        BigDecimal tdsInr = parseOptionalDecimal(normalized, TDS_HEADERS, rowNumber);

        String productType = normalizeProductType(
                firstPresent(normalized, List.of("Product", "Product Type")),
                pairValue
        );
        String orderId = firstPresent(normalized, ORDER_ID_HEADERS);

        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("productType", productType);
        metadata.put("tradeId", tradeId.trim());
        metadata.put("pair", asset.pair());
        metadata.put("side", eventType.name());
        metadata.put("priceInr", price.toPlainString());
        metadata.put("feeInr", feeInr.toPlainString());
        metadata.put("tdsInr", tdsInr.toPlainString());
        if (orderId != null) {
            metadata.put("orderId", orderId.trim());
        }

        return new LedgerEventDraft(
                userId,
                ingestionJobId,
                ExchangeType.COINDCX,
                rowNumber,
                fingerprint(userId, productType, tradeId),
                eventType,
                asset.symbol(),
                quantity,
                grossValueInr,
                occurredAt,
                Map.copyOf(metadata)
        );
    }

    private AssetDetails parseAsset(
            String pairValue,
            String cryptoValue,
            String settlementCurrency,
            long rowNumber
    ) {
        if (pairValue != null) {
            String pair = normalizePair(pairValue);
            if (!pair.endsWith("INR") || pair.length() <= 3) {
                throw rowError(
                        "UNSUPPORTED_QUOTE_ASSET",
                        "Only INR-settled CoinDCX trades are supported",
                        rowNumber
                );
            }
            if (settlementCurrency != null
                    && !"INR".equals(normalizeCurrency(settlementCurrency))) {
                throw rowError(
                        "UNSUPPORTED_QUOTE_ASSET",
                        "Only INR-settled CoinDCX trades are supported",
                        rowNumber
                );
            }
            String symbol = pair.substring(0, pair.length() - 3);
            validateAssetSymbol(symbol, rowNumber);
            return new AssetDetails(symbol, pair);
        }

        if (cryptoValue == null || cryptoValue.isBlank()) {
            throw rowError(
                    "MISSING_COLUMN_VALUE",
                    "Missing value for CoinDCX Crypto or Crypto Pair",
                    rowNumber
            );
        }
        if (settlementCurrency != null
                && !"INR".equals(normalizeCurrency(settlementCurrency))) {
            throw rowError(
                    "UNSUPPORTED_QUOTE_ASSET",
                    "Only INR-settled CoinDCX trades are supported",
                    rowNumber
            );
        }

        String symbol = normalizeCurrency(cryptoValue);
        validateAssetSymbol(symbol, rowNumber);
        return new AssetDetails(symbol, symbol + "INR");
    }

    private LedgerEventType parseSide(String value, long rowNumber) {
        try {
            return LedgerEventType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw rowError(
                    "UNSUPPORTED_TRADE_SIDE",
                    "Trade side must be BUY or SELL",
                    rowNumber
            );
        }
    }

    private Instant parseTimestamp(String value, long rowNumber) {
        String timestamp = value.trim();
        try {
            return Instant.parse(timestamp);
        } catch (DateTimeParseException ignored) {
            // Continue with offset and CoinDCX local-time formats.
        }
        try {
            return OffsetDateTime.parse(timestamp, DateTimeFormatter.ISO_OFFSET_DATE_TIME).toInstant();
        } catch (DateTimeParseException ignored) {
            // Continue with local-time formats.
        }
        for (DateTimeFormatter formatter : LOCAL_TIMESTAMP_FORMATTERS) {
            try {
                return LocalDateTime.parse(timestamp, formatter)
                        .atZone(INDIA_ZONE)
                        .toInstant();
            } catch (DateTimeParseException ignored) {
                // Try the next supported format.
            }
        }
        throw rowError(
                "INVALID_TRANSACTION_TIMESTAMP",
                "Invalid CoinDCX transaction timestamp",
                rowNumber
        );
    }

    private BigDecimal parseOptionalDecimal(
            Map<String, String> row,
            List<String> headers,
            long rowNumber
    ) {
        String value = firstPresent(row, headers);
        return value == null ? BigDecimal.ZERO : parseDecimal(value, false, rowNumber);
    }

    private BigDecimal parseDecimal(String value, boolean positive, long rowNumber) {
        String numericToken = value.trim()
                .replace(",", "")
                .replace("₹", "")
                .trim();
        if (numericToken.toUpperCase(Locale.ROOT).startsWith("INR ")) {
            numericToken = numericToken.substring(4).trim();
        }
        numericToken = numericToken.split("\\s+", 2)[0];

        try {
            BigDecimal parsed = new BigDecimal(numericToken);
            boolean invalid = positive ? parsed.signum() <= 0 : parsed.signum() < 0;
            if (invalid) {
                throw rowError(
                        "INVALID_NUMERIC_VALUE",
                        positive
                                ? "Numeric values must be positive"
                                : "Numeric values cannot be negative",
                        rowNumber
                );
            }
            return parsed;
        } catch (NumberFormatException exception) {
            throw rowError(
                    "INVALID_NUMERIC_VALUE",
                    "Invalid numeric value",
                    rowNumber
            );
        }
    }

    private Map<String, String> normalizeRow(Map<String, String> row) {
        Map<String, String> normalized = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        if (row == null) {
            return normalized;
        }
        row.forEach((key, value) ->
                normalized.put(normalizeHeader(key), value == null ? "" : value.trim()));
        return normalized;
    }

    private String requiredAny(
            Map<String, String> row,
            List<String> headers,
            long rowNumber
    ) {
        String value = firstPresent(row, headers);
        if (value == null) {
            throw rowError(
                    "MISSING_COLUMN_VALUE",
                    "Missing value for column " + headers.getFirst(),
                    rowNumber
            );
        }
        return value;
    }

    private String firstPresent(Map<String, String> row, List<String> headers) {
        for (String header : headers) {
            String value = row.get(normalizeHeader(header));
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String normalizeHeader(String header) {
        if (header == null) {
            return "";
        }
        return header.replace("\uFEFF", "")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String normalizePair(String pair) {
        return PAIR_SEPARATOR.matcher(pair.trim().toUpperCase(Locale.ROOT))
                .replaceAll("");
    }

    private String normalizeCurrency(String currency) {
        return PAIR_SEPARATOR.matcher(currency.trim().toUpperCase(Locale.ROOT))
                .replaceAll("");
    }

    private void validateAssetSymbol(String symbol, long rowNumber) {
        if (!ASSET_SYMBOL.matcher(symbol).matches()) {
            throw rowError(
                    "INVALID_ASSET_SYMBOL",
                    "Invalid CoinDCX asset symbol",
                    rowNumber
            );
        }
    }

    private String normalizeProductType(String productType, String pairValue) {
        if (productType == null || productType.isBlank()) {
            return pairValue == null ? "INSTA" : "SPOT";
        }
        return productType.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
    }

    private String fingerprint(UUID userId, String productType, String tradeId) {
        String canonical = userId
                + "\n"
                + ExchangeType.COINDCX.name()
                + "\n"
                + productType
                + "\n"
                + tradeId.trim()
                + "\n";
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(canonical.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private BadRequestException rowError(String code, String detail, long rowNumber) {
        return new BadRequestException(code, detail + " at CSV row " + rowNumber + ".");
    }

    private static DateTimeFormatter strictFormatter(String pattern) {
        return new DateTimeFormatterBuilder()
                .parseCaseInsensitive()
                .appendPattern(pattern)
                .toFormatter(Locale.ENGLISH)
                .withResolverStyle(ResolverStyle.STRICT);
    }

    private record AssetDetails(String symbol, String pair) {
    }
}
