package in.sounodip.vdaledger.ingestion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "ingestion_errors")
public class IngestionError {

    @Id
    private UUID id;

    @Column(name = "ingestion_job_id", nullable = false)
    private UUID ingestionJobId;

    @Column(name = "row_number", nullable = false)
    private long rowNumber;

    @Column(name = "error_code", nullable = false, length = 100)
    private String errorCode;

    @Column(name = "error_message", nullable = false, columnDefinition = "text")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_row", nullable = false, columnDefinition = "jsonb")
    private Map<String, String> rawRow = new HashMap<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected IngestionError() {
    }

    public IngestionError(
            UUID ingestionJobId,
            long rowNumber,
            String errorCode,
            String errorMessage,
            Map<String, String> rawRow
    ) {
        this.id = UUID.randomUUID();
        this.ingestionJobId = Objects.requireNonNull(ingestionJobId, "ingestionJobId");
        this.rowNumber = rowNumber;
        this.errorCode = Objects.requireNonNull(errorCode, "errorCode");
        this.errorMessage = Objects.requireNonNull(errorMessage, "errorMessage");
        if (rawRow != null) {
            this.rawRow = new HashMap<>(rawRow);
        }
    }

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (rawRow == null) {
            rawRow = new HashMap<>();
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getIngestionJobId() {
        return ingestionJobId;
    }

    public long getRowNumber() {
        return rowNumber;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public Map<String, String> getRawRow() {
        return Map.copyOf(rawRow);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
