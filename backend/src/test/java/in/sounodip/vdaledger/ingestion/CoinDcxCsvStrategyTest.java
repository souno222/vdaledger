package in.sounodip.vdaledger.ingestion;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.ledger.LedgerEventDraft;
import in.sounodip.vdaledger.ledger.LedgerEventType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CoinDcxCsvStrategyTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID JOB_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private CoinDcxCsvStrategy strategy;

    @BeforeEach
    void setUp() {
        strategy = new CoinDcxCsvStrategy();
    }

    @Test
    void parsesValidInrSpotBuyAndSell() {
        LedgerEventDraft buy = strategy.parse(validSpotRow(), 2, USER_ID, JOB_ID);
        Map<String, String> sellRow = new LinkedHashMap<>(validSpotRow());
        sellRow.put("Trade ID", "trade-002");
        sellRow.put("Side (Buy/Sell)", "SELL");
        sellRow.put("Quantity", "0.005 BTC");
        sellRow.put("Gross Amount", "₹35,000.00");
        sellRow.put("TDS (INR)", "350.00");

        LedgerEventDraft sell = strategy.parse(sellRow, 3, USER_ID, JOB_ID);

        assertThat(buy.exchange()).isEqualTo(ExchangeType.COINDCX);
        assertThat(buy.eventType()).isEqualTo(LedgerEventType.BUY);
        assertThat(buy.assetSymbol()).isEqualTo("BTC");
        assertThat(buy.quantity()).isEqualByComparingTo("0.010000");
        assertThat(buy.grossValueInr()).isEqualByComparingTo("50000.00");
        assertThat(buy.occurredAt()).isEqualTo(Instant.parse("2025-07-01T05:00:00Z"));
        assertThat(buy.metadata()).containsEntry("feeInr", "50.00");
        assertThat(sell.eventType()).isEqualTo(LedgerEventType.SELL);
        assertThat(sell.quantity()).isEqualByComparingTo("0.005");
        assertThat(sell.metadata()).containsEntry("tdsInr", "350.00");
    }

    @Test
    void parsesInstaRowAndOffsetTimestamp() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("Trade ID", "insta-001");
        row.put("Crypto", "ETH");
        row.put("Trade Completion Time", "2025-07-01T10:30:00+05:30");
        row.put("Side", "Buy");
        row.put("Avg Buying/Selling Price (INR)", "250000");
        row.put("Quantity", "1.25");
        row.put("Gross Amount Paid/Received (INR)", "312500");
        row.put("Fees (INR)", "0");
        row.put("TDS (INR)", "0");

        LedgerEventDraft draft = strategy.parse(row, 2, USER_ID, JOB_ID);

        assertThat(draft.assetSymbol()).isEqualTo("ETH");
        assertThat(draft.occurredAt()).isEqualTo(Instant.parse("2025-07-01T05:00:00Z"));
        assertThat(draft.metadata())
                .containsEntry("productType", "INSTA")
                .containsEntry("pair", "ETHINR");
    }

    @Test
    void rejectsNonInrPairAndUnsupportedSide() {
        Map<String, String> nonInr = new LinkedHashMap<>(validSpotRow());
        nonInr.put("Crypto Pair", "BTC/USDT");
        nonInr.put("Base Currency", "USDT");
        assertCode(nonInr, "UNSUPPORTED_QUOTE_ASSET");

        Map<String, String> unsupportedSide = new LinkedHashMap<>(validSpotRow());
        unsupportedSide.put("Side (Buy/Sell)", "SWAP");
        assertCode(unsupportedSide, "UNSUPPORTED_TRADE_SIDE");
    }

    @Test
    void rejectsInvalidTimestampMissingTradeIdAndInvalidNumbers() {
        Map<String, String> timestamp = new LinkedHashMap<>(validSpotRow());
        timestamp.put("Trade Completion Time", "not-a-timestamp");
        assertCode(timestamp, "INVALID_TRANSACTION_TIMESTAMP");

        Map<String, String> tradeId = new LinkedHashMap<>(validSpotRow());
        tradeId.put("Trade ID", " ");
        assertCode(tradeId, "MISSING_COLUMN_VALUE");

        Map<String, String> quantity = new LinkedHashMap<>(validSpotRow());
        quantity.put("Quantity", "0");
        assertCode(quantity, "INVALID_NUMERIC_VALUE");

        Map<String, String> fee = new LinkedHashMap<>(validSpotRow());
        fee.put("Fees", "-1");
        assertCode(fee, "INVALID_NUMERIC_VALUE");
    }

    @Test
    void fingerprintUsesStableTradeIdentityAndUser() {
        Map<String, String> changedExport = new LinkedHashMap<>(validSpotRow());
        changedExport.put("Fees", "75");
        changedExport.put("Unrelated Export Column", "new value");

        String first = strategy.parse(validSpotRow(), 2, USER_ID, JOB_ID).rowFingerprint();
        String sameTrade = strategy.parse(changedExport, 9, USER_ID, UUID.randomUUID()).rowFingerprint();
        String otherUser = strategy.parse(validSpotRow(), 2, UUID.randomUUID(), JOB_ID).rowFingerprint();

        assertThat(first).hasSize(64);
        assertThat(sameTrade).isEqualTo(first);
        assertThat(otherUser).isNotEqualTo(first);
    }

    private void assertCode(Map<String, String> row, String code) {
        assertThatThrownBy(() -> strategy.parse(row, 4, USER_ID, JOB_ID))
                .isInstanceOf(BadRequestException.class)
                .extracting(exception -> ((BadRequestException) exception).getCode())
                .isEqualTo(code);
    }

    private Map<String, String> validSpotRow() {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("Order ID", "order-001");
        row.put("Trade ID", "trade-001");
        row.put("Crypto Pair", "BTC/INR");
        row.put("Base Currency", "INR");
        row.put("Trade Completion Time", "2025-07-01 10:30:00");
        row.put("Side (Buy/Sell)", "BUY");
        row.put("Average Buying/Selling Price", "5,000,000");
        row.put("Quantity", "0.010000 BTC");
        row.put("Gross Amount", "50,000.00 INR");
        row.put("Fees", "50.00 INR");
        row.put("TDS (INR)", "0");
        return row;
    }
}
