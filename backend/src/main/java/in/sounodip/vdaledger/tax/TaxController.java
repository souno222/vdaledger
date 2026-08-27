package in.sounodip.vdaledger.tax;

import in.sounodip.vdaledger.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/taxes")
@Tag(name = "Taxes", description = "Educational Indian VDA FIFO tax estimates")
@SecurityRequirement(name = "bearerAuth")
public class TaxController {

    private final TaxCalculationService taxCalculationService;
    private final CurrentUserService currentUserService;

    public TaxController(
            TaxCalculationService taxCalculationService,
            CurrentUserService currentUserService
    ) {
        this.taxCalculationService = taxCalculationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/liability")
    @Operation(
            summary = "Estimate VDA tax liability",
            description = "Supports FY 2025-2026 and FY 2026-2027. Applies FIFO cost basis, 30% base tax, acquisition-cost-only deduction, no loss offset, and a 4% cess estimate. TDS is informational and surcharge is not calculated."
    )
    public TaxReportResponse liability(
            @Parameter(
                    description = "Supported Indian financial year",
                    example = "2025-2026",
                    required = true
            )
            @RequestParam String financialYear
    ) {
        return taxCalculationService.calculate(
                currentUserService.getCurrentUser().getId(),
                financialYear
        );
    }
}
