package in.sounodip.vdaledger.ingestion;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.common.exception.ResourceNotFoundException;
import in.sounodip.vdaledger.ledger.LedgerEvent;
import in.sounodip.vdaledger.ledger.LedgerEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IngestionServiceTest {

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private IngestionJobRepository ingestionJobRepository;

    @Mock
    private IngestionErrorRepository ingestionErrorRepository;

    @Mock
    private LedgerEventRepository ledgerEventRepository;

    private IngestionService service;

    @BeforeEach
    void setUp() {
        lenient().when(ingestionJobRepository.saveAndFlush(any(IngestionJob.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(ingestionErrorRepository.save(any(IngestionError.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(ledgerEventRepository.save(any(LedgerEvent.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CsvStrategyFactory factory = new CsvStrategyFactory(List.of(
                new BinanceCsvStrategy(),
                new CoinDcxCsvStrategy()
        ));
        service = new IngestionService(
                ingestionJobRepository,
                ingestionErrorRepository,
                ledgerEventRepository,
                factory,
                500
        );
    }

    @Test
    void allValidCsvCompletesWithCorrectCounters() {
        IngestionResponse response = service.ingest(
                USER_ID,
                ExchangeType.BINANCE,
                csv(validRow(), sellRow())
        );

        assertThat(response.status()).isEqualTo(IngestionStatus.COMPLETED);
        assertThat(response.totalRows()).isEqualTo(2);
        assertThat(response.importedRows()).isEqualTo(2);
        assertThat(response.failedRows()).isZero();
        assertThat(response.duplicateRows()).isZero();
        verify(ledgerEventRepository, org.mockito.Mockito.times(2)).save(any(LedgerEvent.class));
        verify(ingestionErrorRepository, never()).save(any(IngestionError.class));
    }

    @Test
    void coinDcxCsvUsesCoinDcxStrategy() {
        String body = """
                Trade ID,Crypto Pair,Base Currency,Trade Completion Time,Side (Buy/Sell),Average Buying/Selling Price,Quantity,Gross Amount,Fees,TDS (INR)
                trade-001,BTC/INR,INR,2025-07-01 10:30:00,BUY,5000000,0.010000,50000.00,50.00,0
                """;
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "coindcx-inr-trades.csv",
                "text/csv",
                body.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        IngestionResponse response = service.ingest(USER_ID, ExchangeType.COINDCX, file);

        assertThat(response.exchange()).isEqualTo(ExchangeType.COINDCX);
        assertThat(response.status()).isEqualTo(IngestionStatus.COMPLETED);
        assertThat(response.importedRows()).isEqualTo(1);

        ArgumentCaptor<LedgerEvent> event = ArgumentCaptor.forClass(LedgerEvent.class);
        verify(ledgerEventRepository).save(event.capture());
        assertThat(event.getValue().getExchange()).isEqualTo(ExchangeType.COINDCX);
        assertThat(event.getValue().getAssetSymbol()).isEqualTo("BTC");
    }

    @Test
    void mixedCsvPersistsKnownRowErrorAndContinues() {
        String invalid = "invalid-date,ETHINR,BUY,250000,1.000000 ETH,250000.00 INR,0.001 ETH";

        IngestionResponse response = service.ingest(
                USER_ID,
                ExchangeType.BINANCE,
                csv(validRow(), invalid, sellRow())
        );

        assertThat(response.status()).isEqualTo(IngestionStatus.COMPLETED_WITH_ERRORS);
        assertThat(response.totalRows()).isEqualTo(3);
        assertThat(response.importedRows()).isEqualTo(2);
        assertThat(response.failedRows()).isEqualTo(1);
        ArgumentCaptor<IngestionError> error = ArgumentCaptor.forClass(IngestionError.class);
        verify(ingestionErrorRepository).save(error.capture());
        assertThat(error.getValue().getErrorCode()).isEqualTo("INVALID_TRANSACTION_TIMESTAMP");
        assertThat(error.getValue().getRowNumber()).isEqualTo(3);
    }

    @Test
    void duplicateWithinCurrentFileIsSkippedAndRecorded() {
        IngestionResponse response = service.ingest(
                USER_ID,
                ExchangeType.BINANCE,
                csv(validRow(), validRow())
        );

        assertThat(response.importedRows()).isEqualTo(1);
        assertThat(response.duplicateRows()).isEqualTo(1);
        assertThat(response.status()).isEqualTo(IngestionStatus.COMPLETED_WITH_ERRORS);
        ArgumentCaptor<IngestionError> error = ArgumentCaptor.forClass(IngestionError.class);
        verify(ingestionErrorRepository).save(error.capture());
        assertThat(error.getValue().getErrorCode()).isEqualTo("DUPLICATE_TRANSACTION");
    }

    @Test
    void databaseDuplicateIsSkippedAndRecorded() {
        when(ledgerEventRepository.existsByUserIdAndExchangeAndRowFingerprint(
                any(), any(), any()
        )).thenReturn(true);

        IngestionResponse response = service.ingest(
                USER_ID,
                ExchangeType.BINANCE,
                csv(validRow())
        );

        assertThat(response.importedRows()).isZero();
        assertThat(response.duplicateRows()).isEqualTo(1);
        verify(ledgerEventRepository, never()).save(any(LedgerEvent.class));
    }

    @Test
    void fatalFileReadFailurePersistsFailedStatus() throws Exception {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("broken.csv");
        when(file.getInputStream()).thenThrow(new IOException("read failure"));

        assertThatThrownBy(() -> service.ingest(USER_ID, ExchangeType.BINANCE, file))
                .isInstanceOf(BadRequestException.class)
                .extracting(exception -> ((BadRequestException) exception).getCode())
                .isEqualTo("CSV_READ_FAILED");

        ArgumentCaptor<IngestionJob> jobs = ArgumentCaptor.forClass(IngestionJob.class);
        verify(ingestionJobRepository, atLeast(3)).saveAndFlush(jobs.capture());
        assertThat(jobs.getAllValues())
                .anyMatch(job -> job.getStatus() == IngestionStatus.FAILED);
    }

    @Test
    void foreignOrMissingJobReturnsNotFoundForDetailsAndErrors() {
        UUID jobId = UUID.randomUUID();
        when(ingestionJobRepository.findByIdAndUserId(jobId, USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.details(USER_ID, jobId))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.errors(USER_ID, jobId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private MockMultipartFile csv(String... rows) {
        String body = "Date(UTC),Pair,Side,Price,Executed,Amount,Fee\n"
                + String.join("\n", rows)
                + "\n";
        return new MockMultipartFile(
                "file",
                "trades.csv",
                "text/csv",
                body.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
    }

    private String validRow() {
        return "2025-07-01 10:30:00,BTCINR,BUY,5000000,0.010000 BTC,50000.00 INR,0.000010 BTC";
    }

    private String sellRow() {
        return "2025-08-01 14:00:00,BTCINR,SELL,7000000,0.005000 BTC,35000.00 INR,0.000005 BTC";
    }
}
