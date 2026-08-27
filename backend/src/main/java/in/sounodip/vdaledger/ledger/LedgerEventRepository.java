package in.sounodip.vdaledger.ledger;

import in.sounodip.vdaledger.ingestion.ExchangeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface LedgerEventRepository extends JpaRepository<LedgerEvent, UUID> {

    List<LedgerEvent> findByUserIdOrderByOccurredAtAscIdAsc(UUID userId);

    List<LedgerEvent> findByUserIdAndOccurredAtBeforeOrderByOccurredAtAscIdAsc(
            UUID userId,
            Instant occurredAt
    );

    boolean existsByUserIdAndExchangeAndRowFingerprint(
            UUID userId,
            ExchangeType exchange,
            String rowFingerprint
    );
}
