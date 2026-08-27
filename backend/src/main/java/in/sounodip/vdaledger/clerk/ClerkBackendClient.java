package in.sounodip.vdaledger.clerk;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class ClerkBackendClient {

    private final RestClient restClient;
    private final String secretKey;

    public ClerkBackendClient(RestClient.Builder builder, ClerkProperties properties) {
        if (properties.backendApiUrl() == null) {
            throw new IllegalStateException("The Clerk Backend API URL is not configured.");
        }
        this.secretKey = properties.secretKey();
        this.restClient = builder
                .baseUrl(properties.backendApiUrl().toString())
                .build();
    }

    public ClerkUserProfile getUser(String clerkUserId) {
        requireSecretKey();
        try {
            ClerkUserResponse response = restClient.get()
                    .uri("/users/{userId}", clerkUserId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(ClerkUserResponse.class);

            if (response == null || response.id() == null || response.id().isBlank()) {
                throw new ClerkIntegrationException(
                        "Clerk returned an invalid user response for " + clerkUserId + "."
                );
            }
            return response.toProfile();
        } catch (RestClientResponseException exception) {
            throw new ClerkIntegrationException(
                    "Clerk user lookup failed with status " + exception.getStatusCode().value() + ".",
                    exception
            );
        }
    }

    private void requireSecretKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new ClerkIntegrationException("CLERK_SECRET_KEY is not configured.");
        }
    }
}
