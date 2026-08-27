package in.sounodip.vdaledger.ingestion;

import java.time.Instant;
import java.util.UUID;

public record IngestionJobDetailsResponse(
        UUID jobId,
        ExchangeType exchange,
        String originalFileName,
        IngestionStatus status,
        int totalRows,
        int importedRows,
        int failedRows,
        int duplicateRows,
        Instant createdAt,
        Instant completedAt
) {

    public static IngestionJobDetailsResponse from(IngestionJob job) {
        return new IngestionJobDetailsResponse(
                job.getId(),
                job.getExchange(),
                job.getOriginalFileName(),
                job.getStatus(),
                job.getTotalRows(),
                job.getImportedRows(),
                job.getFailedRows(),
                job.getDuplicateRows(),
                job.getCreatedAt(),
                job.getCompletedAt()
        );
    }
}
