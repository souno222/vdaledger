package in.sounodip.vdaledger.tax.rules;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface VdaTaxRuleSet {

    String financialYear();

    LocalDate effectiveFrom();

    LocalDate effectiveToExclusive();

    BigDecimal taxRate();

    BigDecimal tdsRate();

    BigDecimal specifiedPersonTdsThreshold();

    BigDecimal otherPersonTdsThreshold();

    LossOffsetPolicy lossOffsetPolicy();

    AllowedDeductionPolicy allowedDeductionPolicy();

    BigDecimal cessRate();

    String statutoryReference();
}
