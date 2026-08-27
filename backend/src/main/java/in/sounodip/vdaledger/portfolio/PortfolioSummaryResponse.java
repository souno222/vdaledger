package in.sounodip.vdaledger.portfolio;

import java.util.List;

public record PortfolioSummaryResponse(
        List<AssetHoldingResponse> assets
) {

    public PortfolioSummaryResponse {
        assets = List.copyOf(assets);
    }
}
