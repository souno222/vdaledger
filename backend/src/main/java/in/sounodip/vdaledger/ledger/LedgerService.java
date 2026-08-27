package in.sounodip.vdaledger.ledger;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LedgerService {

    private final LedgerEventRepository ledgerEventRepository;

    public LedgerService(LedgerEventRepository ledgerEventRepository) {
        this.ledgerEventRepository = ledgerEventRepository;
    }

    @Transactional(readOnly = true)
    public List<LedgerEventResponse> list(UUID userId) {
        return ledgerEventRepository.findByUserIdOrderByOccurredAtAscIdAsc(userId).stream()
                .map(LedgerEventResponse::from)
                .toList();
    }
}
