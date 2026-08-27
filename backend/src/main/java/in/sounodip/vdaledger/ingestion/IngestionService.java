package in.sounodip.vdaledger.ingestion;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.exceptions.CsvValidationException;
import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.common.exception.ResourceNotFoundException;
import in.sounodip.vdaledger.ledger.LedgerEvent;
import in.sounodip.vdaledger.ledger.LedgerEventDraft;
import in.sounodip.vdaledger.ledger.LedgerEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class IngestionService {

    private final IngestionJobRepository ingestionJobRepository;
    private final IngestionErrorRepository ingestionErrorRepository;
    private final LedgerEventRepository ledgerEventRepository;
    private final CsvStrategyFactory csvStrategyFactory;
    private final int chunkSize;

    public IngestionService(
            IngestionJobRepository ingestionJobRepository,
            IngestionErrorRepository ingestionErrorRepository,
            LedgerEventRepository ledgerEventRepository,
            CsvStrategyFactory csvStrategyFactory,
            @Value("${app.ingestion.chunk-size:500}") int chunkSize
    ) {
        this.ingestionJobRepository = ingestionJobRepository;
        this.ingestionErrorRepository = ingestionErrorRepository;
        this.ledgerEventRepository = ledgerEventRepository;
        this.csvStrategyFactory = csvStrategyFactory;
        this.chunkSize = Math.max(1, chunkSize);
    }

    public IngestionResponse ingest(UUID userId, ExchangeType exchange, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("EMPTY_CSV_FILE", "A non-empty CSV file is required.");
        }
        String fileName = Objects.requireNonNullElse(file.getOriginalFilename(), "upload.csv");
        IngestionJob job = ingestionJobRepository.saveAndFlush(
                new IngestionJob(userId, exchange, fileName)
        );
        job.markProcessing();
        ingestionJobRepository.saveAndFlush(job);

        try {
            processRows(job, csvStrategyFactory.getStrategy(exchange), file);
            return IngestionResponse.from(ingestionJobRepository.saveAndFlush(job));
        } catch (IOException | CsvValidationException exception) {
            job.markFailed();
            ingestionJobRepository.saveAndFlush(job);
            throw new BadRequestException("CSV_READ_FAILED", "The CSV file could not be read.");
        } catch (RuntimeException exception) {
            job.markFailed();
            ingestionJobRepository.saveAndFlush(job);
            throw exception;
        }
    }

    private void processRows(
            IngestionJob job,
            ExchangeCsvStrategy strategy,
            MultipartFile file
    ) throws IOException, CsvValidationException {
        int totalRows = 0;
        int importedRows = 0;
        int failedRows = 0;
        int duplicateRows = 0;
        Set<String> currentFileFingerprints = new HashSet<>();

        try (CSVReader reader = new CSVReaderBuilder(new BufferedReader(new InputStreamReader(
                file.getInputStream(),
                StandardCharsets.UTF_8
        ))).build()) {
            String[] headers = reader.readNext();
            if (headers == null || headers.length == 0) {
                throw new BadRequestException("MISSING_CSV_HEADER", "The CSV header row is required.");
            }
            List<String> normalizedHeaders = normalizeHeaders(headers);
            String[] values;
            long rowNumber = 1;
            while ((values = reader.readNext()) != null) {
                rowNumber++;
                totalRows++;
                Map<String, String> rawRow = toRow(normalizedHeaders, values);
                try {
                    LedgerEventDraft draft = strategy.parse(
                            rawRow,
                            rowNumber,
                            job.getUserId(),
                            job.getId()
                    );
                    boolean duplicate = !currentFileFingerprints.add(draft.rowFingerprint())
                            || ledgerEventRepository.existsByUserIdAndExchangeAndRowFingerprint(
                                    job.getUserId(),
                                    job.getExchange(),
                                    draft.rowFingerprint()
                            );
                    if (duplicate) {
                        duplicateRows++;
                        saveError(
                                job.getId(),
                                rowNumber,
                                "DUPLICATE_TRANSACTION",
                                "Duplicate transaction at CSV row " + rowNumber + ".",
                                rawRow
                        );
                    } else {
                        ledgerEventRepository.save(toEntity(draft));
                        importedRows++;
                    }
                } catch (BadRequestException exception) {
                    failedRows++;
                    saveError(
                            job.getId(),
                            rowNumber,
                            exception.getCode(),
                            exception.getMessage(),
                            rawRow
                    );
                }

                if (totalRows % chunkSize == 0) {
                    ledgerEventRepository.flush();
                    ingestionErrorRepository.flush();
                }
            }
        }

        ledgerEventRepository.flush();
        ingestionErrorRepository.flush();
        job.complete(totalRows, importedRows, failedRows, duplicateRows);
    }

    public List<IngestionJobDetailsResponse> history(UUID userId) {
        return ingestionJobRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(IngestionJobDetailsResponse::from)
                .toList();
    }

    public IngestionJobDetailsResponse details(UUID userId, UUID jobId) {
        return IngestionJobDetailsResponse.from(requireOwnedJob(userId, jobId));
    }

    public List<IngestionErrorResponse> errors(UUID userId, UUID jobId) {
        IngestionJob job = requireOwnedJob(userId, jobId);
        return ingestionErrorRepository
                .findByIngestionJobIdOrderByRowNumberAsc(job.getId())
                .stream()
                .map(IngestionErrorResponse::from)
                .toList();
    }

    private IngestionJob requireOwnedJob(UUID userId, UUID jobId) {
        return ingestionJobRepository.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "INGESTION_JOB_NOT_FOUND",
                        "Ingestion job not found."
                ));
    }

    private List<String> normalizeHeaders(String[] headers) {
        List<String> normalized = new ArrayList<>(headers.length);
        Set<String> unique = new HashSet<>();
        for (String header : headers) {
            String value = header == null ? "" : header.replace("\uFEFF", "").trim();
            if (value.isBlank() || !unique.add(value.toLowerCase(java.util.Locale.ROOT))) {
                throw new BadRequestException(
                        "INVALID_CSV_HEADER",
                        "CSV headers must be non-empty and unique."
                );
            }
            normalized.add(value);
        }
        return normalized;
    }

    private Map<String, String> toRow(List<String> headers, String[] values) {
        Map<String, String> row = new LinkedHashMap<>();
        for (int index = 0; index < headers.size(); index++) {
            row.put(headers.get(index), index < values.length && values[index] != null
                    ? values[index].trim()
                    : "");
        }
        return row;
    }

    private LedgerEvent toEntity(LedgerEventDraft draft) {
        return new LedgerEvent(
                draft.userId(),
                draft.ingestionJobId(),
                draft.exchange(),
                Math.toIntExact(draft.sourceRowNumber()),
                draft.rowFingerprint(),
                draft.eventType(),
                draft.assetSymbol(),
                draft.quantity(),
                draft.grossValueInr(),
                draft.occurredAt(),
                draft.metadata()
        );
    }

    private void saveError(
            UUID jobId,
            long rowNumber,
            String code,
            String message,
            Map<String, String> rawRow
    ) {
        ingestionErrorRepository.save(new IngestionError(
                jobId,
                rowNumber,
                code,
                message,
                rawRow
        ));
    }
}
