package in.sounodip.vdaledger.tax;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AcquisitionLotTest {

    @Test
    void partiallyConsumesProportionalCostBasis() {
        AcquisitionLot lot = lot("1.0", "100.00");

        BigDecimal consumed = lot.consume(new BigDecimal("0.25"));

        assertThat(consumed).isEqualByComparingTo("25.00");
        assertThat(lot.getRemainingQuantity()).isEqualByComparingTo("0.75");
        assertThat(lot.getRemainingCostInr()).isEqualByComparingTo("75.00");
    }

    @Test
    void fullConsumptionUsesCompleteRemainingCost() {
        AcquisitionLot lot = lot("0.5", "123.45");

        assertThat(lot.consume(new BigDecimal("0.5"))).isEqualByComparingTo("123.45");
        assertThat(lot.getRemainingQuantity()).isZero();
        assertThat(lot.getRemainingCostInr()).isZero();
    }

    @Test
    void multiplePartialConsumptionsPreserveFinalRounding() {
        AcquisitionLot lot = lot("3", "100.00");

        BigDecimal total = lot.consume(BigDecimal.ONE)
                .add(lot.consume(BigDecimal.ONE))
                .add(lot.consume(BigDecimal.ONE));

        assertThat(total).isEqualByComparingTo("100.00");
        assertThat(lot.getRemainingQuantity()).isZero();
        assertThat(lot.getRemainingCostInr()).isZero();
    }

    @Test
    void rejectsOverConsumption() {
        AcquisitionLot lot = lot("1", "100");

        assertThatThrownBy(() -> lot.consume(new BigDecimal("1.01")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsNonPositiveConsumption() {
        AcquisitionLot lot = lot("1", "100");

        assertThatThrownBy(() -> lot.consume(BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> lot.consume(new BigDecimal("-0.1")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private AcquisitionLot lot(String quantity, String cost) {
        return new AcquisitionLot(
                new BigDecimal(quantity),
                new BigDecimal(cost),
                Instant.parse("2025-01-01T00:00:00Z"),
                UUID.randomUUID()
        );
    }
}
