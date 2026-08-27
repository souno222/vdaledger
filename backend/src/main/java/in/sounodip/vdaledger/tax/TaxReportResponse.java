package in.sounodip.vdaledger.tax;

import in.sounodip.vdaledger.tax.rules.AllowedDeductionPolicy;
import in.sounodip.vdaledger.tax.rules.LossOffsetPolicy;
import in.sounodip.vdaledger.tax.rules.VdaTaxRuleSet;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TaxReportResponse(
        String financialYear,
        Instant periodStart,
        Instant periodEndExclusive,
        BigDecimal grossPositiveIncome,
        BigDecimal excludedLosses,
        BigDecimal baseVdaTax,
        BigDecimal applicableSurcharge,
        BigDecimal healthAndEducationCess,
        BigDecimal estimatedTotalTax,
        int processedSellEvents,
        Rules rules,
        List<String> warnings
) {

    public TaxReportResponse {
        warnings = List.copyOf(warnings);
    }

    public record Rules(
            BigDecimal taxRate,
            BigDecimal tdsRate,
            BigDecimal specifiedPersonTdsThreshold,
            BigDecimal otherPersonTdsThreshold,
            LossOffsetPolicy lossOffsetPolicy,
            AllowedDeductionPolicy allowedDeductionPolicy,
            BigDecimal cessRate,
            String statutoryReference
    ) {

        public static Rules from(VdaTaxRuleSet ruleSet) {
            return new Rules(
                    ruleSet.taxRate(),
                    ruleSet.tdsRate(),
                    ruleSet.specifiedPersonTdsThreshold(),
                    ruleSet.otherPersonTdsThreshold(),
                    ruleSet.lossOffsetPolicy(),
                    ruleSet.allowedDeductionPolicy(),
                    ruleSet.cessRate(),
                    ruleSet.statutoryReference()
            );
        }
    }
}
