package in.sounodip.vdaledger.clerk;

import com.svix.Webhook;
import in.sounodip.vdaledger.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.net.URI;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ClerkWebhookVerifierTest {

    private static final String SECRET =
            "whsec_TWZLUTlyOEdLWXFyVHdqVVBEOElMUFpJbzJMYUxhU3c=";

    @Test
    void acceptsAValidUntouchedPayload() throws Exception {
        String payload = """
                {"type":"user.created","data":{"id":"user_123"}}
                """.trim();
        String messageId = "msg_valid_123";
        long timestamp = Instant.now().getEpochSecond();
        HttpHeaders headers = signedHeaders(messageId, timestamp, payload);
        ClerkWebhookVerifier verifier = verifier(SECRET);

        assertThatCode(() -> verifier.verify(payload, headers))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsTamperedPayload() throws Exception {
        String original = """
                {"type":"user.created"}
                """.trim();
        long timestamp = Instant.now().getEpochSecond();
        HttpHeaders headers = signedHeaders("msg_tampered", timestamp, original);

        assertThatThrownBy(() -> verifier(SECRET).verify(
                """
                        {"type":"user.deleted"}
                        """.trim(),
                headers
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("signature");
    }

    @Test
    void failsClosedWhenSigningSecretIsMissing() {
        assertThatThrownBy(() -> verifier("").verify("{}", new HttpHeaders()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CLERK_WEBHOOK_SIGNING_SECRET");
    }

    private HttpHeaders signedHeaders(
            String messageId,
            long timestamp,
            String payload
    ) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("svix-id", messageId);
        headers.set("svix-timestamp", Long.toString(timestamp));
        headers.set(
                "svix-signature",
                new Webhook(SECRET).sign(messageId, timestamp, payload)
        );
        return headers;
    }

    private ClerkWebhookVerifier verifier(String secret) {
        return new ClerkWebhookVerifier(new ClerkProperties(
                "sk_test",
                secret,
                URI.create("https://api.clerk.test/v1")
        ));
    }
}
