package in.sounodip.vdaledger.tax.rules;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VdaTaxRuleSetResolverTest {

    private VdaTaxRuleSetResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new VdaTaxRuleSetResolver(List.of(
                new IndiaFy2025To2026RuleSet(),
                new IndiaFy2026To2027RuleSet()
        ));
    }

    @Test
    void resolvesFy2025To2026() {
        assertThat(resolver.resolve("2025-2026"))
                .isInstanceOf(IndiaFy2025To2026RuleSet.class);
    }

    @Test
    void resolvesFy2026To2027() {
        assertThat(resolver.resolve("2026-2027"))
                .isInstanceOf(IndiaFy2026To2027RuleSet.class);
    }

    @Test
    void rejectsUnsupportedFinancialYear() {
        assertThatThrownBy(() -> resolver.resolve("2027-2028"))
                .isInstanceOf(BadRequestException.class)
                .extracting(exception -> ((BadRequestException) exception).getCode())
                .isEqualTo("UNSUPPORTED_FINANCIAL_YEAR");
    }
}
