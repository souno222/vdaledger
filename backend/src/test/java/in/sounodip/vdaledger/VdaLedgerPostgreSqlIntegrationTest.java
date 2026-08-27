package in.sounodip.vdaledger;

import in.sounodip.vdaledger.clerk.ClerkUserProfile;
import in.sounodip.vdaledger.clerk.ClerkWebhookDeliveryStore;
import in.sounodip.vdaledger.common.exception.ResourceNotFoundException;
import in.sounodip.vdaledger.ingestion.ExchangeType;
import in.sounodip.vdaledger.ingestion.IngestionErrorRepository;
import in.sounodip.vdaledger.ingestion.IngestionJobDetailsResponse;
import in.sounodip.vdaledger.ingestion.IngestionResponse;
import in.sounodip.vdaledger.ingestion.IngestionService;
import in.sounodip.vdaledger.ingestion.IngestionStatus;
import in.sounodip.vdaledger.ledger.LedgerEventRepository;
import in.sounodip.vdaledger.portfolio.PortfolioService;
import in.sounodip.vdaledger.portfolio.PortfolioSummaryResponse;
import in.sounodip.vdaledger.tax.TaxCalculationService;
import in.sounodip.vdaledger.tax.TaxReportResponse;
import in.sounodip.vdaledger.user.AppUser;
import in.sounodip.vdaledger.user.AppUserRepository;
import in.sounodip.vdaledger.user.AppUserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class VdaLedgerPostgreSqlIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("vda_ledger")
                    .withUsername("vda_admin")
                    .withPassword("vda_password");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private IngestionService ingestionService;

    @Autowired
    private IngestionErrorRepository ingestionErrorRepository;

    @Autowired
    private LedgerEventRepository ledgerEventRepository;

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private TaxCalculationService taxCalculationService;

    @Autowired
    private AppUserService appUserService;

    @Autowired
    private ClerkWebhookDeliveryStore clerkWebhookDeliveryStore;

    @Test
    void mixedCsvFlowsThroughHistoryLedgerPortfolioTaxAndOwnership() {
        AppUser userA = appUserRepository.saveAndFlush(
                new AppUser("user_integration_a", "a@example.com")
        );
        AppUser userB = appUserRepository.saveAndFlush(
                new AppUser("user_integration_b", "b@example.com")
        );

        IngestionResponse ingestion = ingestionService.ingest(
                userA.getId(),
                ExchangeType.BINANCE,
                mixedCsv()
        );

        assertThat(ingestion.status()).isEqualTo(IngestionStatus.COMPLETED_WITH_ERRORS);
        assertThat(ingestion.totalRows()).isEqualTo(3);
        assertThat(ingestion.importedRows()).isEqualTo(2);
        assertThat(ingestion.failedRows()).isEqualTo(1);
        assertThat(ingestion.duplicateRows()).isZero();

        List<IngestionJobDetailsResponse> history = ingestionService.history(userA.getId());
        assertThat(history).hasSize(1);
        assertThat(history.getFirst().jobId()).isEqualTo(ingestion.jobId());

        assertThat(ingestionErrorRepository
                .findByIngestionJobIdOrderByRowNumberAsc(ingestion.jobId()))
                .singleElement()
                .satisfies(error -> {
                    assertThat(error.getRowNumber()).isEqualTo(3);
                    assertThat(error.getErrorCode()).isEqualTo("INVALID_TRANSACTION_TIMESTAMP");
                });
        assertThat(ledgerEventRepository.findByUserIdOrderByOccurredAtAscIdAsc(userA.getId()))
                .hasSize(2);

        PortfolioSummaryResponse portfolio = portfolioService.summary(userA.getId());
        assertThat(portfolio.assets()).singleElement().satisfies(holding -> {
            assertThat(holding.assetSymbol()).isEqualTo("BTC");
            assertThat(holding.quantity()).isEqualByComparingTo("0.005000");
        });

        TaxReportResponse tax = taxCalculationService.calculate(userA.getId(), "2025-2026");
        assertThat(tax.grossPositiveIncome()).isEqualByComparingTo("10000.00");
        assertThat(tax.baseVdaTax()).isEqualByComparingTo("3000.00");
        assertThat(tax.healthAndEducationCess()).isEqualByComparingTo("120.00");
        assertThat(tax.estimatedTotalTax()).isEqualByComparingTo("3120.00");

        assertThat(ingestionService.history(userB.getId())).isEmpty();
        assertThatThrownBy(() -> ingestionService.details(userB.getId(), ingestion.jobId()))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> ingestionService.errors(userB.getId(), ingestion.jobId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void clerkSynchronizationRejectsStaleEventsAndSoftDeletes() {
        String clerkUserId = "user_clerk_sync_integration";
        Instant createdAt = Instant.parse("2026-01-01T00:00:00Z");
        Instant firstUpdate = Instant.parse("2026-01-02T00:00:00Z");
        Instant secondUpdate = Instant.parse("2026-01-03T00:00:00Z");
        Instant deletion = Instant.parse("2026-01-04T00:00:00Z");

        appUserService.synchronize(new ClerkUserProfile(
                clerkUserId,
                "first@example.com",
                "First",
                "User",
                null,
                createdAt,
                firstUpdate
        ));
        appUserService.synchronize(new ClerkUserProfile(
                clerkUserId,
                "newest@example.com",
                "Newest",
                "User",
                null,
                createdAt,
                secondUpdate
        ));
        appUserService.synchronize(new ClerkUserProfile(
                clerkUserId,
                "stale@example.com",
                "Stale",
                "User",
                null,
                createdAt,
                firstUpdate
        ));

        AppUser beforeDelete = appUserRepository.findByClerkUserId(clerkUserId)
                .orElseThrow();
        assertThat(beforeDelete.getEmail()).isEqualTo("newest@example.com");
        assertThat(beforeDelete.getFirstName()).isEqualTo("Newest");

        appUserService.markDeleted(clerkUserId, deletion);
        appUserService.synchronize(new ClerkUserProfile(
                clerkUserId,
                "late-stale@example.com",
                "Late",
                "Stale",
                null,
                createdAt,
                secondUpdate
        ));

        AppUser deleted = appUserRepository.findByClerkUserId(clerkUserId)
                .orElseThrow();
        assertThat(deleted.isClerkDeleted()).isTrue();
        assertThat(deleted.getDeletedAt()).isNotNull();
        assertThat(deleted.getEmail()).isEqualTo("newest@example.com");
    }

    @Test
    void webhookDeliveryClaimIsIdempotent() {
        Instant now = Instant.now();

        assertThat(clerkWebhookDeliveryStore.claim(
                "msg_integration_duplicate",
                "user.updated",
                "user_delivery",
                now
        )).isTrue();
        assertThat(clerkWebhookDeliveryStore.claim(
                "msg_integration_duplicate",
                "user.updated",
                "user_delivery",
                now
        )).isFalse();
    }

    private MockMultipartFile mixedCsv() {
        String csv = """
                Date(UTC),Pair,Side,Price,Executed,Amount,Fee
                2025-07-01 10:30:00,BTCINR,BUY,5000000,0.010000 BTC,50000.00 INR,0.000010 BTC
                invalid-date,ETHINR,BUY,250000,1.000000 ETH,250000.00 INR,0.001 ETH
                2025-08-01 14:00:00,BTCINR,SELL,7000000,0.005000 BTC,35000.00 INR,0.000005 BTC
                """;
        return new MockMultipartFile(
                "file",
                "binance-inr-mixed.csv",
                "text/csv",
                csv.getBytes(StandardCharsets.UTF_8)
        );
    }
}
