package in.sounodip.vdaledger.tax;

import in.sounodip.vdaledger.common.util.MoneyUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class AcquisitionLot {

    private BigDecimal remainingQuantity;
    private BigDecimal remainingCostInr;
    private final Instant acquiredAt;
    private final UUID sourceEventId;

    public AcquisitionLot(
            BigDecimal remainingQuantity,
            BigDecimal remainingCostInr,
            Instant acquiredAt,
            UUID sourceEventId
    ) {
        if (remainingQuantity == null || remainingQuantity.signum() <= 0) {
            throw new IllegalArgumentException("Acquisition quantity must be positive");
        }
        if (remainingCostInr == null || remainingCostInr.signum() <= 0) {
            throw new IllegalArgumentException("Acquisition cost must be positive");
        }
        this.remainingQuantity = remainingQuantity;
        this.remainingCostInr = remainingCostInr;
        this.acquiredAt = Objects.requireNonNull(acquiredAt, "acquiredAt");
        this.sourceEventId = Objects.requireNonNull(sourceEventId, "sourceEventId");
    }

    public BigDecimal consume(BigDecimal requestedQuantity) {
        if (requestedQuantity == null || requestedQuantity.signum() <= 0) {
            throw new IllegalArgumentException("Consumption quantity must be positive");
        }
        if (requestedQuantity.compareTo(remainingQuantity) > 0) {
            throw new IllegalArgumentException("Consumption exceeds the remaining lot quantity");
        }
        if (requestedQuantity.compareTo(remainingQuantity) == 0) {
            BigDecimal finalCost = remainingCostInr;
            remainingQuantity = BigDecimal.ZERO;
            remainingCostInr = BigDecimal.ZERO;
            return finalCost;
        }

        BigDecimal consumedCost = MoneyUtils.proportionalCost(
                remainingCostInr,
                requestedQuantity,
                remainingQuantity
        );
        remainingQuantity = remainingQuantity.subtract(requestedQuantity);
        remainingCostInr = remainingCostInr.subtract(consumedCost);
        return consumedCost;
    }

    public BigDecimal getRemainingQuantity() {
        return remainingQuantity;
    }

    public BigDecimal getRemainingCostInr() {
        return remainingCostInr;
    }

    public Instant getAcquiredAt() {
        return acquiredAt;
    }

    public UUID getSourceEventId() {
        return sourceEventId;
    }
}
