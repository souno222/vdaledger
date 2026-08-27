package in.sounodip.vdaledger.ingestion;

import in.sounodip.vdaledger.ledger.LedgerEventDraft;

import java.util.Map;
import java.util.UUID;

public interface ExchangeCsvStrategy {

    ExchangeType supportedExchange();

    LedgerEventDraft parse(
            Map<String, String> row,
            long rowNumber,
            UUID userId,
            UUID ingestionJobId
    );
}
