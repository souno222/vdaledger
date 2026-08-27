package in.sounodip.vdaledger.common.exception;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(name = "ApiError", description = "Consistent API error response")
public record ApiErrorResponse(
        @Schema(example = "2026-07-13T10:00:00Z")
        Instant timestamp,
        @Schema(example = "400")
        int status,
        @Schema(example = "Bad Request")
        String error,
        @Schema(example = "INVALID_CSV_ROW")
        String code,
        @Schema(example = "Invalid quantity at CSV row 4.")
        String message,
        @Schema(example = "/api/ingestions")
        String path
) {
}
