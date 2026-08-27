package in.sounodip.vdaledger.portfolio;

import in.sounodip.vdaledger.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
@Tag(name = "Portfolio", description = "Current quantity-only holdings derived from ledger events")
@SecurityRequirement(name = "bearerAuth")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final CurrentUserService currentUserService;

    public PortfolioController(
            PortfolioService portfolioService,
            CurrentUserService currentUserService
    ) {
        this.portfolioService = portfolioService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get current holdings", description = "Adds BUY quantities, subtracts SELL quantities, rejects negative balances, and omits zero positions. No live prices or unrealized gains are calculated.")
    public PortfolioSummaryResponse summary() {
        return portfolioService.summary(currentUserService.getCurrentUser().getId());
    }
}
