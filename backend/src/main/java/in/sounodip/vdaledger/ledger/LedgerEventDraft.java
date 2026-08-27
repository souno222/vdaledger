package in.sounodip.vdaledger.ledger;

import in.sounodip.vdaledger.ingestion.ExchangeType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record LedgerEventDraft(
        UUID userId,
        UUID ingestionJobId,
        ExchangeType exchange,
        long sourceRowNumber,
        String rowFingerprint,
        LedgerEventType eventType,
        String assetSymbol,
        BigDecimal quantity,
        BigDecimal grossValueInr,
        Instant occurredAt,
        Map<String, String> metadata
) {
}
