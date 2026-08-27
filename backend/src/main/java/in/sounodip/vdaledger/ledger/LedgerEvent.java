package in.sounodip.vdaledger.ledger;

import in.sounodip.vdaledger.ingestion.ExchangeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "ledger_events")
public class LedgerEvent {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "ingestion_job_id")
    private UUID ingestionJobId;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ExchangeType exchange;

    @Column(name = "source_row_number")
    private Integer sourceRowNumber;

    @Column(name = "row_fingerprint", length = 64)
    private String rowFingerprint;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private LedgerEventType eventType;

    @Column(name = "asset_symbol", nullable = false, length = 30)
    private String assetSymbol;

    @Column(nullable = false, precision = 38, scale = 18)
    private BigDecimal quantity;

    @Column(name = "gross_value_inr", nullable = false, precision = 38, scale = 2)
    private BigDecimal grossValueInr;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, String> metadata = new HashMap<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected LedgerEvent() {
    }

    public LedgerEvent(
            UUID userId,
            UUID ingestionJobId,
            ExchangeType exchange,
            Integer sourceRowNumber,
            String rowFingerprint,
            LedgerEventType eventType,
            String assetSymbol,
            BigDecimal quantity,
            BigDecimal grossValueInr,
            Instant occurredAt,
            Map<String, String> metadata
    ) {
        this.id = UUID.randomUUID();
        this.userId = Objects.requireNonNull(userId, "userId");
        this.ingestionJobId = ingestionJobId;
        this.exchange = exchange;
        this.sourceRowNumber = sourceRowNumber;
        this.rowFingerprint = rowFingerprint;
        this.eventType = Objects.requireNonNull(eventType, "eventType");
        this.assetSymbol = Objects.requireNonNull(assetSymbol, "assetSymbol");
        this.quantity = Objects.requireNonNull(quantity, "quantity");
        this.grossValueInr = Objects.requireNonNull(grossValueInr, "grossValueInr");
        this.occurredAt = Objects.requireNonNull(occurredAt, "occurredAt");
        if (metadata != null) {
            this.metadata = new HashMap<>(metadata);
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
        if (metadata == null) {
            metadata = new HashMap<>();
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getIngestionJobId() {
        return ingestionJobId;
    }

    public ExchangeType getExchange() {
        return exchange;
    }

    public Integer getSourceRowNumber() {
        return sourceRowNumber;
    }

    public String getRowFingerprint() {
        return rowFingerprint;
    }

    public LedgerEventType getEventType() {
        return eventType;
    }

    public String getAssetSymbol() {
        return assetSymbol;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public BigDecimal getGrossValueInr() {
        return grossValueInr;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public Map<String, String> getMetadata() {
        return Map.copyOf(metadata);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
