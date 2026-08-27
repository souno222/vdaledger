package in.sounodip.vdaledger.ledger;

import in.sounodip.vdaledger.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ledger-events")
@Tag(name = "Ledger", description = "Normalized authenticated-user BUY and SELL events")
@SecurityRequirement(name = "bearerAuth")
public class LedgerController {

    private final LedgerService ledgerService;
    private final CurrentUserService currentUserService;

    public LedgerController(LedgerService ledgerService, CurrentUserService currentUserService) {
        this.ledgerService = ledgerService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "List ledger events", description = "Returns the authenticated user's events ordered by occurrence time and ID.")
    public List<LedgerEventResponse> list() {
        return ledgerService.list(currentUserService.getCurrentUser().getId());
    }
}
