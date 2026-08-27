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
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class BinanceCsvStrategy implements ExchangeCsvStrategy {

    private static final DateTimeFormatter BINANCE_TIMESTAMP = DateTimeFormatter
            .ofPattern("uuuu-MM-dd HH:mm:ss")
            .withResolverStyle(ResolverStyle.STRICT);
    private static final Pattern PAIR_SEPARATOR = Pattern.compile("[/\\-_\\s]");

    @Override
    public ExchangeType supportedExchange() {
        return ExchangeType.BINANCE;
    }

    @Override
    public LedgerEventDraft parse(
            Map<String, String> row,
            long rowNumber,
            UUID userId,
            UUID ingestionJobId
    ) {
        Map<String, String> normalized = normalizeRow(row);
        String timestampValue = required(normalized, "Date(UTC)", rowNumber);
        String pairValue = required(normalized, "Pair", rowNumber);
        String sideValue = required(normalized, "Side", rowNumber);
        String priceValue = required(normalized, "Price", rowNumber);
        String executedValue = required(normalized, "Executed", rowNumber);
        String amountValue = required(normalized, "Amount", rowNumber);
        String feeValue = required(normalized, "Fee", rowNumber);

        Instant occurredAt = parseTimestamp(timestampValue, rowNumber);
        String normalizedPair = PAIR_SEPARATOR.matcher(pairValue.trim().toUpperCase(Locale.ROOT))
                .replaceAll("");
        if (!normalizedPair.endsWith("INR") || normalizedPair.length() <= 3) {
            throw rowError(
                    "UNSUPPORTED_QUOTE_ASSET",
                    "Only INR quote pairs are supported",
                    rowNumber
            );
        }
        String assetSymbol = normalizedPair.substring(0, normalizedPair.length() - 3);

        LedgerEventType eventType;
        try {
            eventType = LedgerEventType.valueOf(sideValue.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw rowError(
                    "UNSUPPORTED_TRADE_SIDE",
                    "Trade side must be BUY or SELL",
                    rowNumber
            );
        }

        BigDecimal price = parsePositiveDecimal(priceValue, rowNumber);
        BigDecimal quantity = parsePositiveDecimal(executedValue, rowNumber);
        BigDecimal grossValueInr = parsePositiveDecimal(amountValue, rowNumber);
        BigDecimal fee = parsePositiveDecimal(feeValue, rowNumber);

        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("pair", normalizedPair);
        metadata.put("side", eventType.name());
        metadata.put("price", price.toPlainString());
        metadata.put("fee", fee.toPlainString());
        metadata.put("rawFee", feeValue.trim());

        return new LedgerEventDraft(
                userId,
                ingestionJobId,
                ExchangeType.BINANCE,
                rowNumber,
                fingerprint(userId, ExchangeType.BINANCE, normalized),
                eventType,
                assetSymbol,
                quantity,
                grossValueInr,
                occurredAt,
                Map.copyOf(metadata)
        );
    }

    private Map<String, String> normalizeRow(Map<String, String> row) {
        Map<String, String> normalized = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        if (row == null) {
            return normalized;
        }
        row.forEach((key, value) -> normalized.put(normalizeHeader(key), value == null ? "" : value.trim()));
        return normalized;
    }

    private String normalizeHeader(String header) {
        if (header == null) {
            return "";
        }
        return header.replace("\uFEFF", "").trim();
    }

    private String required(Map<String, String> row, String header, long rowNumber) {
        String value = row.get(normalizeHeader(header));
        if (value == null || value.isBlank()) {
            throw rowError(
                    "MISSING_COLUMN_VALUE",
                    "Missing value for column " + header,
                    rowNumber
            );
        }
        return value;
    }

    private Instant parseTimestamp(String value, long rowNumber) {
        try {
            return LocalDateTime.parse(value.trim(), BINANCE_TIMESTAMP).toInstant(ZoneOffset.UTC);
        } catch (DateTimeParseException exception) {
            throw rowError(
                    "INVALID_TRANSACTION_TIMESTAMP",
                    "Invalid transaction timestamp",
                    rowNumber
            );
        }
    }

    private BigDecimal parsePositiveDecimal(String value, long rowNumber) {
        String numericToken = value.trim().split("\\s+", 2)[0].replace(",", "");
        try {
            BigDecimal parsed = new BigDecimal(numericToken);
            if (parsed.signum() <= 0) {
                throw rowError(
                        "INVALID_NUMERIC_VALUE",
                        "Numeric values must be positive",
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

    private String fingerprint(
            UUID userId,
            ExchangeType exchange,
            Map<String, String> normalizedRow
    ) {
        StringBuilder canonical = new StringBuilder()
                .append(userId)
                .append('\n')
                .append(exchange.name())
                .append('\n');
        normalizedRow.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator.comparing(
                        value -> value.toLowerCase(Locale.ROOT)
                )))
                .forEach(entry -> canonical
                        .append(entry.getKey().trim().toLowerCase(Locale.ROOT))
                        .append('=')
                        .append(entry.getValue().trim())
                        .append('\n'));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(canonical.toString().getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private BadRequestException rowError(String code, String detail, long rowNumber) {
        return new BadRequestException(code, detail + " at CSV row " + rowNumber + ".");
    }
}
