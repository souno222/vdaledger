package in.sounodip.vdaledger.ingestion;

import java.util.UUID;

public record IngestionResponse(
        UUID jobId,
        ExchangeType exchange,
        IngestionStatus status,
        int totalRows,
        int importedRows,
        int failedRows,
        int duplicateRows,
        String message
) {

    public static IngestionResponse from(IngestionJob job) {
        String message = switch (job.getStatus()) {
            case COMPLETED -> "CSV ingestion completed successfully.";
            case COMPLETED_WITH_ERRORS ->
                    "CSV ingestion completed with rejected or duplicate rows.";
            case FAILED -> "CSV ingestion failed.";
            case PENDING, PROCESSING -> "CSV ingestion is in progress.";
        };
        return new IngestionResponse(
                job.getId(),
                job.getExchange(),
                job.getStatus(),
                job.getTotalRows(),
                job.getImportedRows(),
                job.getFailedRows(),
                job.getDuplicateRows(),
                message
        );
    }
}
