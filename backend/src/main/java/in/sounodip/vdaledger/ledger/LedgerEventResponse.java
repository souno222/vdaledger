package in.sounodip.vdaledger.ledger;

import in.sounodip.vdaledger.ingestion.ExchangeType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record LedgerEventResponse(
        UUID id,
        UUID ingestionJobId,
        ExchangeType exchange,
        Integer sourceRowNumber,
        LedgerEventType eventType,
        String assetSymbol,
        BigDecimal quantity,
        BigDecimal grossValueInr,
        Instant occurredAt,
        Map<String, String> metadata
) {

    public static LedgerEventResponse from(LedgerEvent event) {
        return new LedgerEventResponse(
                event.getId(),
                event.getIngestionJobId(),
                event.getExchange(),
                event.getSourceRowNumber(),
                event.getEventType(),
                event.getAssetSymbol(),
                event.getQuantity(),
                event.getGrossValueInr(),
                event.getOccurredAt(),
                event.getMetadata()
        );
    }
}
