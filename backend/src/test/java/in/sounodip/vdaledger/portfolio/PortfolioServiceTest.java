package in.sounodip.vdaledger.portfolio;

import in.sounodip.vdaledger.common.exception.InsufficientAssetBalanceException;
import in.sounodip.vdaledger.ledger.LedgerEvent;
import in.sounodip.vdaledger.ledger.LedgerEventRepository;
import in.sounodip.vdaledger.ledger.LedgerEventType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PortfolioServiceTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final LedgerEventRepository repository = mock(LedgerEventRepository.class);
    private final PortfolioService service = new PortfolioService(repository);

    @Test
    void calculatesHoldingsAndOmitsZeroBalances() {
        when(repository.findByUserIdOrderByOccurredAtAscIdAsc(USER_ID)).thenReturn(List.of(
                event(LedgerEventType.BUY, "BTC", "0.010"),
                event(LedgerEventType.SELL, "BTC", "0.005"),
                event(LedgerEventType.BUY, "ETH", "1.0"),
                event(LedgerEventType.SELL, "ETH", "1.0")
        ));

        PortfolioSummaryResponse result = service.summary(USER_ID);

        assertThat(result.assets()).containsExactly(
                new AssetHoldingResponse("BTC", new BigDecimal("0.005"))
        );
    }

    @Test
    void rejectsImpossibleNegativeBalance() {
        when(repository.findByUserIdOrderByOccurredAtAscIdAsc(USER_ID)).thenReturn(List.of(
                event(LedgerEventType.SELL, "BTC", "0.001")
        ));

        assertThatThrownBy(() -> service.summary(USER_ID))
                .isInstanceOf(InsufficientAssetBalanceException.class);
    }

    @Test
    void emptyLedgerReturnsEmptyPortfolio() {
        when(repository.findByUserIdOrderByOccurredAtAscIdAsc(USER_ID)).thenReturn(List.of());

        assertThat(service.summary(USER_ID).assets()).isEmpty();
    }

    private LedgerEvent event(LedgerEventType type, String asset, String quantity) {
        return new LedgerEvent(
                USER_ID,
                null,
                null,
                null,
                null,
                type,
                asset,
                new BigDecimal(quantity),
                new BigDecimal("1000.00"),
                Instant.parse("2025-07-01T00:00:00Z"),
                Map.of()
        );
    }
}
