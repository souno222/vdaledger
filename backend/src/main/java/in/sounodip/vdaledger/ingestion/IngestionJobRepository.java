package in.sounodip.vdaledger.ingestion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IngestionJobRepository extends JpaRepository<IngestionJob, UUID> {

    List<IngestionJob> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<IngestionJob> findByIdAndUserId(UUID id, UUID userId);
}
