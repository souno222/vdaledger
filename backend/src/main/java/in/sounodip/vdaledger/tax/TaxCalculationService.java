package in.sounodip.vdaledger.tax;

import in.sounodip.vdaledger.common.exception.InsufficientAssetBalanceException;
import in.sounodip.vdaledger.common.util.MoneyUtils;
import in.sounodip.vdaledger.ledger.LedgerEvent;
import in.sounodip.vdaledger.ledger.LedgerEventRepository;
import in.sounodip.vdaledger.ledger.LedgerEventType;
import in.sounodip.vdaledger.tax.rules.VdaTaxRuleSet;
import in.sounodip.vdaledger.tax.rules.VdaTaxRuleSetResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TaxCalculationService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final String SURCHARGE_WARNING =
            "Surcharge is not calculated because the user's complete taxable income and "
                    + "taxpayer category are unavailable. The estimate assumes zero surcharge.";
    private static final String TDS_WARNING =
            "TDS values are informational rule metadata only. Actual TDS deducted or "
                    + "available as credit is not calculated.";

    private final LedgerEventRepository ledgerEventRepository;
    private final VdaTaxRuleSetResolver ruleSetResolver;

    public TaxCalculationService(
            LedgerEventRepository ledgerEventRepository,
            VdaTaxRuleSetResolver ruleSetResolver
    ) {
        this.ledgerEventRepository = ledgerEventRepository;
        this.ruleSetResolver = ruleSetResolver;
    }

    @Transactional(readOnly = true)
    public TaxReportResponse calculate(UUID userId, String financialYear) {
        VdaTaxRuleSet ruleSet = ruleSetResolver.resolve(financialYear);
        Instant periodStart = ruleSet.effectiveFrom().atStartOfDay(INDIA_ZONE).toInstant();
        Instant periodEndExclusive = ruleSet.effectiveToExclusive()
                .atStartOfDay(INDIA_ZONE)
                .toInstant();
        List<LedgerEvent> events =
                ledgerEventRepository.findByUserIdAndOccurredAtBeforeOrderByOccurredAtAscIdAsc(
                        userId,
                        periodEndExclusive
                );

        Map<String, Deque<AcquisitionLot>> lotsByAsset = new HashMap<>();
        BigDecimal grossPositiveIncome = BigDecimal.ZERO;
        BigDecimal excludedLosses = BigDecimal.ZERO;
        int processedSellEvents = 0;

        for (LedgerEvent event : events) {
            Deque<AcquisitionLot> lots = lotsByAsset.computeIfAbsent(
                    event.getAssetSymbol(),
                    ignored -> new ArrayDeque<>()
            );
            if (event.getEventType() == LedgerEventType.BUY) {
                lots.addLast(new AcquisitionLot(
                        event.getQuantity(),
                        event.getGrossValueInr(),
                        event.getOccurredAt(),
                        event.getId()
                ));
                continue;
            }

            BigDecimal costBasis = consumeCostBasis(
                    event.getAssetSymbol(),
                    event.getQuantity(),
                    lots
            );
            if (event.getOccurredAt().isBefore(periodStart)) {
                continue;
            }

            processedSellEvents++;
            BigDecimal gainOrLoss = event.getGrossValueInr().subtract(costBasis);
            if (gainOrLoss.signum() > 0) {
                grossPositiveIncome = grossPositiveIncome.add(gainOrLoss);
            } else if (gainOrLoss.signum() < 0) {
                excludedLosses = excludedLosses.add(gainOrLoss.abs());
            }
        }

        grossPositiveIncome = MoneyUtils.inr(grossPositiveIncome);
        excludedLosses = MoneyUtils.inr(excludedLosses);
        BigDecimal baseVdaTax = MoneyUtils.inr(
                grossPositiveIncome.multiply(ruleSet.taxRate(), MoneyUtils.DECIMAL_CONTEXT)
        );
        BigDecimal cess = MoneyUtils.inr(
                baseVdaTax.multiply(ruleSet.cessRate(), MoneyUtils.DECIMAL_CONTEXT)
        );
        BigDecimal estimatedTotal = MoneyUtils.inr(baseVdaTax.add(cess));

        return new TaxReportResponse(
                ruleSet.financialYear(),
                periodStart,
                periodEndExclusive,
                grossPositiveIncome,
                excludedLosses,
                baseVdaTax,
                null,
                cess,
                estimatedTotal,
                processedSellEvents,
                TaxReportResponse.Rules.from(ruleSet),
                List.of(SURCHARGE_WARNING, TDS_WARNING)
        );
    }

    private BigDecimal consumeCostBasis(
            String assetSymbol,
            BigDecimal requestedQuantity,
            Deque<AcquisitionLot> lots
    ) {
        BigDecimal remaining = requestedQuantity;
        BigDecimal costBasis = BigDecimal.ZERO;
        while (remaining.signum() > 0) {
            AcquisitionLot lot = lots.peekFirst();
            if (lot == null) {
                throw new InsufficientAssetBalanceException(
                        "Not enough " + assetSymbol + " inventory to process a SELL event."
                );
            }
            BigDecimal consumed = remaining.min(lot.getRemainingQuantity());
            costBasis = costBasis.add(lot.consume(consumed));
            remaining = remaining.subtract(consumed);
            if (lot.getRemainingQuantity().signum() == 0) {
                lots.removeFirst();
            }
        }
        return costBasis;
    }
}
