package in.sounodip.vdaledger.clerk;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ClerkBackendClientTest {

    @Test
    void sendsSecretKeyAndMapsThePrimaryEmail() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ClerkBackendClient client = new ClerkBackendClient(
                builder,
                new ClerkProperties(
                        "sk_test_server_only",
                        "whsec_test",
                        URI.create("https://api.clerk.test/v1")
                )
        );
        server.expect(requestTo("https://api.clerk.test/v1/users/user_123"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer sk_test_server_only"
                ))
                .andRespond(withSuccess("""
                        {
                          "id": "user_123",
                          "primary_email_address_id": "idn_primary",
                          "email_addresses": [
                            {"id": "idn_other", "email_address": "other@example.com"},
                            {"id": "idn_primary", "email_address": "primary@example.com"}
                          ],
                          "first_name": "Asha",
                          "last_name": "Rao",
                          "image_url": "https://img.clerk.test/user.png",
                          "created_at": 1710000000000,
                          "updated_at": 1710000005000
                        }
                        """, MediaType.APPLICATION_JSON));

        ClerkUserProfile profile = client.getUser("user_123");

        assertThat(profile.primaryEmail()).isEqualTo("primary@example.com");
        assertThat(profile.firstName()).isEqualTo("Asha");
        assertThat(profile.clerkUpdatedAt()).isAfter(profile.clerkCreatedAt());
        server.verify();
    }

    @Test
    void rejectsLookupWhenSecretKeyIsMissing() {
        ClerkBackendClient client = new ClerkBackendClient(
                RestClient.builder(),
                new ClerkProperties(
                        "",
                        "whsec_test",
                        URI.create("https://api.clerk.test/v1")
                )
        );

        assertThatThrownBy(() -> client.getUser("user_123"))
                .isInstanceOf(ClerkIntegrationException.class)
                .hasMessageContaining("CLERK_SECRET_KEY");
    }
}
