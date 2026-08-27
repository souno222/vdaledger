package in.sounodip.vdaledger.common.util;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

public final class MoneyUtils {

    public static final MathContext DECIMAL_CONTEXT = new MathContext(34, RoundingMode.HALF_UP);
    public static final int COST_BASIS_SCALE = 18;
    public static final int INR_REPORT_SCALE = 2;

    private MoneyUtils() {
    }

    public static BigDecimal proportionalCost(
            BigDecimal totalCost,
            BigDecimal consumedQuantity,
            BigDecimal totalQuantity
    ) {
        return totalCost.multiply(consumedQuantity, DECIMAL_CONTEXT)
                .divide(totalQuantity, COST_BASIS_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal inr(BigDecimal value) {
        return value.setScale(INR_REPORT_SCALE, RoundingMode.HALF_UP);
    }
}
