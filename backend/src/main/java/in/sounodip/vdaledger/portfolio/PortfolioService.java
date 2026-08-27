package in.sounodip.vdaledger.portfolio;

import in.sounodip.vdaledger.common.exception.InsufficientAssetBalanceException;
import in.sounodip.vdaledger.ledger.LedgerEvent;
import in.sounodip.vdaledger.ledger.LedgerEventRepository;
import in.sounodip.vdaledger.ledger.LedgerEventType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
public class PortfolioService {

    private final LedgerEventRepository ledgerEventRepository;

    public PortfolioService(LedgerEventRepository ledgerEventRepository) {
        this.ledgerEventRepository = ledgerEventRepository;
    }

    @Transactional(readOnly = true)
    public PortfolioSummaryResponse summary(UUID userId) {
        Map<String, BigDecimal> balances = new TreeMap<>();
        for (LedgerEvent event :
                ledgerEventRepository.findByUserIdOrderByOccurredAtAscIdAsc(userId)) {
            String asset = event.getAssetSymbol();
            BigDecimal current = balances.getOrDefault(asset, BigDecimal.ZERO);
            BigDecimal updated = event.getEventType() == LedgerEventType.BUY
                    ? current.add(event.getQuantity())
                    : current.subtract(event.getQuantity());
            if (updated.signum() < 0) {
                throw new InsufficientAssetBalanceException(
                        "Ledger event " + event.getId()
                                + " would make the " + asset + " balance negative."
                );
            }
            balances.put(asset, updated);
        }

        return new PortfolioSummaryResponse(
                balances.entrySet().stream()
                        .filter(entry -> entry.getValue().signum() != 0)
                        .map(entry -> new AssetHoldingResponse(entry.getKey(), entry.getValue()))
                        .toList()
        );
    }
}
