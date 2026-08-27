package in.sounodip.vdaledger.ingestion;

import in.sounodip.vdaledger.security.CurrentUserService;
import in.sounodip.vdaledger.user.AppUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ingestions")
@Tag(name = "Ingestions", description = "Synchronous Binance and CoinDCX INR CSV ingestion, history, and row-level errors")
@SecurityRequirement(name = "bearerAuth")
public class IngestionController {

    private final IngestionService ingestionService;
    private final CurrentUserService currentUserService;

    public IngestionController(
            IngestionService ingestionService,
            CurrentUserService currentUserService
    ) {
        this.ingestionService = ingestionService;
        this.currentUserService = currentUserService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload a supported exchange INR trade CSV",
            description = "Binance and CoinDCX INR BUY/SELL rows become normalized ledger events; rejected and duplicate rows are retained as ingestion errors."
    )
    public ResponseEntity<IngestionResponse> upload(
            @Parameter(description = "CSV exchange", schema = @Schema(allowableValues = {"BINANCE", "COINDCX"}))
            @RequestParam("exchange") ExchangeType exchange,
            @Parameter(description = "UTF-8 exchange CSV file")
            @RequestParam("file") MultipartFile file
    ) {
        AppUser user = currentUserService.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ingestionService.ingest(user.getId(), exchange, file));
    }

    @GetMapping
    @Operation(summary = "List ingestion history", description = "Returns only the authenticated user's jobs, newest first.")
    public List<IngestionJobDetailsResponse> history() {
        return ingestionService.history(currentUserService.getCurrentUser().getId());
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Get ingestion job details", description = "Returns 404 for a missing job or a job owned by another user.")
    public IngestionJobDetailsResponse details(@PathVariable UUID jobId) {
        return ingestionService.details(currentUserService.getCurrentUser().getId(), jobId);
    }

    @GetMapping("/{jobId}/errors")
    @Operation(summary = "List ingestion row errors", description = "Returns rejected and duplicate rows after first verifying job ownership.")
    public List<IngestionErrorResponse> errors(@PathVariable UUID jobId) {
        return ingestionService.errors(currentUserService.getCurrentUser().getId(), jobId);
    }
}
