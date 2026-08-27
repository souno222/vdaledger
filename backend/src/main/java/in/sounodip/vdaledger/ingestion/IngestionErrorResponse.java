package in.sounodip.vdaledger.ingestion;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record IngestionErrorResponse(
        UUID id,
        long rowNumber,
        String errorCode,
        String errorMessage,
        Map<String, String> rawRow,
        Instant createdAt
) {

    public static IngestionErrorResponse from(IngestionError error) {
        return new IngestionErrorResponse(
                error.getId(),
                error.getRowNumber(),
                error.getErrorCode(),
                error.getErrorMessage(),
                error.getRawRow(),
                error.getCreatedAt()
        );
    }
}
