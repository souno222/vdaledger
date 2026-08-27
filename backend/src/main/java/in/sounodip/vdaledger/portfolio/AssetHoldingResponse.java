package in.sounodip.vdaledger.portfolio;

import java.math.BigDecimal;

public record AssetHoldingResponse(
        String assetSymbol,
        BigDecimal quantity
) {
}
