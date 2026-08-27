package in.sounodip.vdaledger.ingestion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IngestionErrorRepository extends JpaRepository<IngestionError, UUID> {

    List<IngestionError> findByIngestionJobIdOrderByRowNumberAsc(UUID ingestionJobId);
}
