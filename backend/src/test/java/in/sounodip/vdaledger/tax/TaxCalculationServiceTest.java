package in.sounodip.vdaledger.tax;

import in.sounodip.vdaledger.common.exception.InsufficientAssetBalanceException;
import in.sounodip.vdaledger.ledger.LedgerEvent;
import in.sounodip.vdaledger.ledger.LedgerEventRepository;
import in.sounodip.vdaledger.ledger.LedgerEventType;
import in.sounodip.vdaledger.tax.rules.IndiaFy2025To2026RuleSet;
import in.sounodip.vdaledger.tax.rules.IndiaFy2026To2027RuleSet;
import in.sounodip.vdaledger.tax.rules.LossOffsetPolicy;
import in.sounodip.vdaledger.tax.rules.VdaTaxRuleSetResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TaxCalculationServiceTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private LedgerEventRepository repository;
    private TaxCalculationService service;

    @BeforeEach
    void setUp() {
        repository = mock(LedgerEventRepository.class);
        VdaTaxRuleSetResolver resolver = new VdaTaxRuleSetResolver(List.of(
                new IndiaFy2025To2026RuleSet(),
                new IndiaFy2026To2027RuleSet()
        ));
        service = new TaxCalculationService(repository, resolver);
    }

    @Test
    void calculatesSingleBuyPartialSellTaxCessAndTotal() {
        givenEvents(
                event(LedgerEventType.BUY, "BTC", "0.010", "50000.00", "2025-05-01T00:00:00Z"),
                event(LedgerEventType.SELL, "BTC", "0.005", "35000.00", "2025-07-01T00:00:00Z")
        );

        TaxReportResponse report = service.calculate(USER_ID, "2025-2026");

        assertThat(report.periodStart()).isEqualTo(Instant.parse("2025-03-31T18:30:00Z"));
        assertThat(report.periodEndExclusive()).isEqualTo(Instant.parse("2026-03-31T18:30:00Z"));
        assertThat(report.grossPositiveIncome()).isEqualByComparingTo("10000.00");
        assertThat(report.excludedLosses()).isEqualByComparingTo("0.00");
        assertThat(report.baseVdaTax()).isEqualByComparingTo("3000.00");
        assertThat(report.healthAndEducationCess()).isEqualByComparingTo("120.00");
        assertThat(report.estimatedTotalTax()).isEqualByComparingTo("3120.00");
        assertThat(report.applicableSurcharge()).isNull();
        assertThat(report.processedSellEvents()).isEqualTo(1);
        assertThat(report.rules().lossOffsetPolicy())
                .isEqualTo(LossOffsetPolicy.NO_SET_OFF_OR_CARRY_FORWARD);
        assertThat(report.warnings()).hasSize(2);
    }

    @Test
    void consumesMultipleFifoLotsWhenSellSpansLots() {
        givenEvents(
                event(LedgerEventType.BUY, "ETH", "1", "100.00", "2025-04-01T00:00:00Z"),
                event(LedgerEventType.BUY, "ETH", "1", "200.00", "2025-05-01T00:00:00Z"),
                event(LedgerEventType.SELL, "ETH", "1.5", "450.00", "2025-06-01T00:00:00Z")
        );

        TaxReportResponse report = service.calculate(USER_ID, "2025-2026");

        assertThat(report.grossPositiveIncome()).isEqualByComparingTo("250.00");
        assertThat(report.processedSellEvents()).isEqualTo(1);
    }

    @Test
    void positiveGainsAndLossesAreNotOffset() {
        givenEvents(
                event(LedgerEventType.BUY, "BTC", "1", "100.00", "2025-04-01T00:00:00Z"),
                event(LedgerEventType.SELL, "BTC", "1", "150.00", "2025-05-01T00:00:00Z"),
                event(LedgerEventType.BUY, "ETH", "1", "200.00", "2025-06-01T00:00:00Z"),
                event(LedgerEventType.SELL, "ETH", "1", "120.00", "2025-07-01T00:00:00Z")
        );

        TaxReportResponse report = service.calculate(USER_ID, "2025-2026");

        assertThat(report.grossPositiveIncome()).isEqualByComparingTo("50.00");
        assertThat(report.excludedLosses()).isEqualByComparingTo("80.00");
        assertThat(report.baseVdaTax()).isEqualByComparingTo("15.00");
        assertThat(report.estimatedTotalTax()).isEqualByComparingTo("15.60");
    }

    @Test
    void priorBuyAndSellDetermineOpeningFifoInventory() {
        givenEvents(
                event(LedgerEventType.BUY, "BTC", "2", "200.00", "2025-01-01T00:00:00Z"),
                event(LedgerEventType.SELL, "BTC", "0.5", "75.00", "2025-02-01T00:00:00Z"),
                event(LedgerEventType.SELL, "BTC", "1", "200.00", "2025-05-01T00:00:00Z")
        );

        TaxReportResponse report = service.calculate(USER_ID, "2025-2026");

        assertThat(report.grossPositiveIncome()).isEqualByComparingTo("100.00");
        assertThat(report.processedSellEvents()).isEqualTo(1);
    }

    @Test
    void insufficientInventoryIsRejected() {
        givenEvents(
                event(LedgerEventType.SELL, "BTC", "0.1", "1000.00", "2025-05-01T00:00:00Z")
        );

        assertThatThrownBy(() -> service.calculate(USER_ID, "2025-2026"))
                .isInstanceOf(InsufficientAssetBalanceException.class);
    }

    @Test
    void emptyLedgerReturnsZeroReportWithIndiaBoundaries() {
        when(repository.findByUserIdAndOccurredAtBeforeOrderByOccurredAtAscIdAsc(
                eq(USER_ID),
                eq(Instant.parse("2027-03-31T18:30:00Z"))
        )).thenReturn(List.of());

        TaxReportResponse report = service.calculate(USER_ID, "2026-2027");

        assertThat(report.periodStart()).isEqualTo(Instant.parse("2026-03-31T18:30:00Z"));
        assertThat(report.periodEndExclusive()).isEqualTo(Instant.parse("2027-03-31T18:30:00Z"));
        assertThat(report.grossPositiveIncome()).isEqualByComparingTo("0.00");
        assertThat(report.estimatedTotalTax()).isEqualByComparingTo("0.00");
        assertThat(report.processedSellEvents()).isZero();
    }

    private void givenEvents(LedgerEvent... events) {
        when(repository.findByUserIdAndOccurredAtBeforeOrderByOccurredAtAscIdAsc(
                eq(USER_ID),
                eq(Instant.parse("2026-03-31T18:30:00Z"))
        )).thenReturn(List.of(events));
    }

    private LedgerEvent event(
            LedgerEventType type,
            String asset,
            String quantity,
            String grossValue,
            String occurredAt
    ) {
        return new LedgerEvent(
                USER_ID,
                null,
                null,
                null,
                null,
                type,
                asset,
                new BigDecimal(quantity),
                new BigDecimal(grossValue),
                Instant.parse(occurredAt),
                Map.of()
        );
    }
}
