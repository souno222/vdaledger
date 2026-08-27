package in.sounodip.vdaledger.tax.rules;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class VdaTaxRuleSetResolver {

    private final Map<String, VdaTaxRuleSet> ruleSets;

    public VdaTaxRuleSetResolver(List<VdaTaxRuleSet> ruleSets) {
        this.ruleSets = Map.copyOf(ruleSets.stream().collect(Collectors.toMap(
                VdaTaxRuleSet::financialYear,
                Function.identity(),
                (first, second) -> {
                    throw new IllegalStateException(
                            "Duplicate VDA tax rule set for " + first.financialYear()
                    );
                }
        )));
    }

    public VdaTaxRuleSet resolve(String financialYear) {
        VdaTaxRuleSet ruleSet = ruleSets.get(financialYear);
        if (ruleSet == null) {
            throw new BadRequestException(
                    "UNSUPPORTED_FINANCIAL_YEAR",
                    "Financial year " + financialYear + " is not supported."
            );
        }
        return ruleSet;
    }
}
