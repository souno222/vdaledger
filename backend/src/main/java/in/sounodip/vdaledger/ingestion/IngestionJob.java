package in.sounodip.vdaledger.ingestion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "ingestion_jobs")
public class IngestionJob {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExchangeType exchange;

    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private IngestionStatus status;

    @Column(name = "total_rows", nullable = false)
    private int totalRows;

    @Column(name = "imported_rows", nullable = false)
    private int importedRows;

    @Column(name = "failed_rows", nullable = false)
    private int failedRows;

    @Column(name = "duplicate_rows", nullable = false)
    private int duplicateRows;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected IngestionJob() {
    }

    public IngestionJob(UUID userId, ExchangeType exchange, String originalFileName) {
        this.id = UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "userId");
        this.exchange = Objects.requireNonNull(exchange, "exchange");
        this.originalFileName = Objects.requireNonNull(originalFileName, "originalFileName");
        this.status = IngestionStatus.PENDING;
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = IngestionStatus.PENDING;
        }
    }

    public void markProcessing() {
        status = IngestionStatus.PROCESSING;
    }

    public void complete(int totalRows, int importedRows, int failedRows, int duplicateRows) {
        if (totalRows < 0 || importedRows < 0 || failedRows < 0 || duplicateRows < 0) {
            throw new IllegalArgumentException("Ingestion counters cannot be negative");
        }
        this.totalRows = totalRows;
        this.importedRows = importedRows;
        this.failedRows = failedRows;
        this.duplicateRows = duplicateRows;
        this.status = failedRows == 0 && duplicateRows == 0
                ? IngestionStatus.COMPLETED
                : IngestionStatus.COMPLETED_WITH_ERRORS;
        this.completedAt = Instant.now();
    }

    public void markFailed() {
        status = IngestionStatus.FAILED;
        completedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public ExchangeType getExchange() {
        return exchange;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public IngestionStatus getStatus() {
        return status;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public int getImportedRows() {
        return importedRows;
    }

    public int getFailedRows() {
        return failedRows;
    }

    public int getDuplicateRows() {
        return duplicateRows;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }
}
