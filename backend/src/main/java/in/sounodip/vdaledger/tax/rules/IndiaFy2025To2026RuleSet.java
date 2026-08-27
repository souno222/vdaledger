package in.sounodip.vdaledger.tax.rules;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class IndiaFy2025To2026RuleSet implements VdaTaxRuleSet {

    @Override
    public String financialYear() {
        return "2025-2026";
    }

    @Override
    public LocalDate effectiveFrom() {
        return LocalDate.of(2025, 4, 1);
    }

    @Override
    public LocalDate effectiveToExclusive() {
        return LocalDate.of(2026, 4, 1);
    }

    @Override
    public BigDecimal taxRate() {
        return new BigDecimal("0.30");
    }

    @Override
    public BigDecimal tdsRate() {
        return new BigDecimal("0.01");
    }

    @Override
    public BigDecimal specifiedPersonTdsThreshold() {
        return new BigDecimal("50000.00");
    }

    @Override
    public BigDecimal otherPersonTdsThreshold() {
        return new BigDecimal("10000.00");
    }

    @Override
    public LossOffsetPolicy lossOffsetPolicy() {
        return LossOffsetPolicy.NO_SET_OFF_OR_CARRY_FORWARD;
    }

    @Override
    public AllowedDeductionPolicy allowedDeductionPolicy() {
        return AllowedDeductionPolicy.COST_OF_ACQUISITION_ONLY;
    }

    @Override
    public BigDecimal cessRate() {
        return new BigDecimal("0.04");
    }

    @Override
    public String statutoryReference() {
        return "Income-tax Act, Section 115BBH; Section 194S";
    }
}
