package in.sounodip.vdaledger.config;

import in.sounodip.vdaledger.common.HealthController;
import in.sounodip.vdaledger.common.exception.ResourceNotFoundException;
import in.sounodip.vdaledger.clerk.ClerkWebhookController;
import in.sounodip.vdaledger.clerk.ClerkWebhookService;
import in.sounodip.vdaledger.clerk.ClerkWebhookVerifier;
import in.sounodip.vdaledger.ingestion.IngestionController;
import in.sounodip.vdaledger.ingestion.IngestionService;
import in.sounodip.vdaledger.portfolio.PortfolioController;
import in.sounodip.vdaledger.portfolio.PortfolioService;
import in.sounodip.vdaledger.portfolio.PortfolioSummaryResponse;
import in.sounodip.vdaledger.security.CurrentUserService;
import in.sounodip.vdaledger.ratelimit.RedisRateLimiter;
import in.sounodip.vdaledger.tax.TaxCalculationService;
import in.sounodip.vdaledger.tax.TaxController;
import in.sounodip.vdaledger.tax.TaxReportResponse;
import in.sounodip.vdaledger.user.AppUser;
import in.sounodip.vdaledger.user.UserController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({
        HealthController.class,
        ClerkWebhookController.class,
        UserController.class,
        IngestionController.class,
        PortfolioController.class,
        TaxController.class
})
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CurrentUserService currentUserService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private RedisRateLimiter redisRateLimiter;

    @MockitoBean
    private IngestionService ingestionService;

    @MockitoBean
    private PortfolioService portfolioService;

    @MockitoBean
    private TaxCalculationService taxCalculationService;

    @MockitoBean
    private ClerkWebhookVerifier clerkWebhookVerifier;

    @MockitoBean
    private ClerkWebhookService clerkWebhookService;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void protectedEndpointWithoutJwtReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"))
                .andExpect(jsonPath("$.path").value("/api/users/me"));
    }

    @Test
    void clerkWebhookEndpointIsPublicAndUsesSignatureVerification() throws Exception {
        when(clerkWebhookService.process(any(), any()))
                .thenReturn(ClerkWebhookService.Result.PROCESSED);

        mockMvc.perform(post("/api/webhooks/clerk")
                        .contentType("application/json")
                        .header("svix-id", "msg_public")
                        .content("""
                                {
                                  "type": "user.created",
                                  "timestamp": 1710000005000,
                                  "data": {"id": "user_123"}
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("processed"));

        verify(clerkWebhookVerifier).verify(any(), any());
    }

    @Test
    void authenticatedUserCanRetrieveOwnProfile() throws Exception {
        AppUser user = new AppUser("user_clerk_123", "user@example.com");
        when(currentUserService.getCurrentUser()).thenReturn(user);

        mockMvc.perform(get("/api/users/me")
                        .with(jwt().jwt(token -> token
                                .subject("user_clerk_123")
                                .claim("email", "user@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clerkUserId").value("user_clerk_123"))
                .andExpect(jsonPath("$.email").value("user@example.com"));
    }

    @Test
    void portfolioUsesAuthenticatedInternalUser() throws Exception {
        AppUser user = new AppUser("user_portfolio", "portfolio@example.com");
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(portfolioService.summary(user.getId()))
                .thenReturn(new PortfolioSummaryResponse(List.of()));

        mockMvc.perform(get("/api/portfolio/summary").with(jwt()))
                .andExpect(status().isOk());

        verify(portfolioService).summary(user.getId());
    }

    @Test
    void taxUsesAuthenticatedInternalUser() throws Exception {
        AppUser user = new AppUser("user_tax", "tax@example.com");
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(taxCalculationService.calculate(user.getId(), "2025-2026"))
                .thenReturn(mock(TaxReportResponse.class));

        mockMvc.perform(get("/api/taxes/liability")
                        .param("financialYear", "2025-2026")
                        .with(jwt()))
                .andExpect(status().isOk());

        verify(taxCalculationService).calculate(user.getId(), "2025-2026");
    }

    @Test
    void foreignIngestionJobDetailsReturnNotFound() throws Exception {
        AppUser user = new AppUser("user_owner", "owner@example.com");
        UUID jobId = UUID.randomUUID();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(ingestionService.details(user.getId(), jobId))
                .thenThrow(new ResourceNotFoundException(
                        "INGESTION_JOB_NOT_FOUND",
                        "Ingestion job not found."
                ));

        mockMvc.perform(get("/api/ingestions/{jobId}", jobId).with(jwt()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("INGESTION_JOB_NOT_FOUND"));
    }

    @Test
    void foreignIngestionErrorsReturnNotFound() throws Exception {
        AppUser user = new AppUser("user_owner", "owner@example.com");
        UUID jobId = UUID.randomUUID();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(ingestionService.errors(user.getId(), jobId))
                .thenThrow(new ResourceNotFoundException(
                        "INGESTION_JOB_NOT_FOUND",
                        "Ingestion job not found."
                ));

        mockMvc.perform(get("/api/ingestions/{jobId}/errors", jobId).with(jwt()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("INGESTION_JOB_NOT_FOUND"));
    }
}
