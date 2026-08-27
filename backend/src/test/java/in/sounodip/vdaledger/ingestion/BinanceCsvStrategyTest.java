package in.sounodip.vdaledger.ingestion;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.ledger.LedgerEventDraft;
import in.sounodip.vdaledger.ledger.LedgerEventType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BinanceCsvStrategyTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID JOB_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private BinanceCsvStrategy strategy;

    @BeforeEach
    void setUp() {
        strategy = new BinanceCsvStrategy();
    }

    @Test
    void parsesValidInrBuyAndSell() {
        LedgerEventDraft buy = strategy.parse(validRow(), 2, USER_ID, JOB_ID);
        Map<String, String> sellRow = new LinkedHashMap<>(validRow());
        sellRow.put("Side", "SELL");
        sellRow.put("Executed", "0.005000 BTC");
        sellRow.put("Amount", "35000.00 INR");
        LedgerEventDraft sell = strategy.parse(sellRow, 3, USER_ID, JOB_ID);

        assertThat(buy.eventType()).isEqualTo(LedgerEventType.BUY);
        assertThat(buy.assetSymbol()).isEqualTo("BTC");
        assertThat(buy.quantity()).isEqualByComparingTo(new BigDecimal("0.010000"));
        assertThat(buy.grossValueInr()).isEqualByComparingTo(new BigDecimal("50000.00"));
        assertThat(buy.occurredAt()).isEqualTo(Instant.parse("2025-07-01T10:30:00Z"));
        assertThat(sell.eventType()).isEqualTo(LedgerEventType.SELL);
        assertThat(sell.quantity()).isEqualByComparingTo(new BigDecimal("0.005000"));
    }

    @Test
    void toleratesHeaderWhitespaceBomPairSeparatorsAndNumericCommas() {
        for (String pair : new String[]{"BTC/INR", "BTC-INR", "BTC_INR"}) {
            Map<String, String> row = new LinkedHashMap<>();
            row.put("\uFEFF Date(UTC) ", " 2025-07-01 10:30:00 ");
            row.put(" pair ", pair);
            row.put(" SIDE ", " buy ");
            row.put("price", "5,000,000");
            row.put("EXECUTED", "0.010000 BTC");
            row.put("Amount", "50,000.00 INR");
            row.put("Fee", "0.000010 BTC");

            LedgerEventDraft draft = strategy.parse(row, 2, USER_ID, JOB_ID);

            assertThat(draft.assetSymbol()).isEqualTo("BTC");
            assertThat(draft.grossValueInr()).isEqualByComparingTo("50000.00");
        }
    }

    @Test
    void rejectsInvalidTimestamp() {
        Map<String, String> row = new LinkedHashMap<>(validRow());
        row.put("Date(UTC)", "invalid-date");

        assertCode(row, "INVALID_TRANSACTION_TIMESTAMP");
    }

    @Test
    void rejectsMissingColumnValue() {
        Map<String, String> row = new LinkedHashMap<>(validRow());
        row.put("Executed", " ");

        assertCode(row, "MISSING_COLUMN_VALUE");
    }

    @Test
    void rejectsMalformedZeroAndNegativeNumbers() {
        for (Map.Entry<String, String> invalid : Map.of(
                "Price", "not-a-number",
                "Executed", "0 BTC",
                "Amount", "-1 INR"
        ).entrySet()) {
            Map<String, String> row = new LinkedHashMap<>(validRow());
            row.put(invalid.getKey(), invalid.getValue());
            assertCode(row, "INVALID_NUMERIC_VALUE");
        }
    }

    @Test
    void rejectsUnsupportedTradeSideAndQuoteAsset() {
        Map<String, String> side = new LinkedHashMap<>(validRow());
        side.put("Side", "SWAP");
        assertCode(side, "UNSUPPORTED_TRADE_SIDE");

        Map<String, String> quote = new LinkedHashMap<>(validRow());
        quote.put("Pair", "BTCUSDT");
        assertCode(quote, "UNSUPPORTED_QUOTE_ASSET");
    }

    @Test
    void fingerprintIsStableAcrossHeaderOrderAndCasing() {
        Map<String, String> reordered = new LinkedHashMap<>();
        validRow().entrySet().stream()
                .sorted(Map.Entry.<String, String>comparingByKey().reversed())
                .forEach(entry -> reordered.put(
                        entry.getKey().toUpperCase(java.util.Locale.ROOT),
                        " " + entry.getValue() + " "
                ));

        String first = strategy.parse(validRow(), 2, USER_ID, JOB_ID).rowFingerprint();
        String second = strategy.parse(reordered, 2, USER_ID, JOB_ID).rowFingerprint();

        assertThat(second).isEqualTo(first);
        assertThat(first).hasSize(64);
    }

    @Test
    void fingerprintDiffersForDifferentUsers() {
        String first = strategy.parse(validRow(), 2, USER_ID, JOB_ID).rowFingerprint();
        String second = strategy.parse(validRow(), 2, UUID.randomUUID(), JOB_ID).rowFingerprint();

        assertThat(second).isNotEqualTo(first);
    }

    private void assertCode(Map<String, String> row, String code) {
        assertThatThrownBy(() -> strategy.parse(row, 4, USER_ID, JOB_ID))
                .isInstanceOf(BadRequestException.class)
                .extracting(exception -> ((BadRequestException) exception).getCode())
                .isEqualTo(code);
    }

    private Map<String, String> validRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("Date(UTC)", "2025-07-01 10:30:00");
        row.put("Pair", "BTCINR");
        row.put("Side", "BUY");
        row.put("Price", "5000000");
        row.put("Executed", "0.010000 BTC");
        row.put("Amount", "50000.00 INR");
        row.put("Fee", "0.000010 BTC");
        return row;
    }
}
