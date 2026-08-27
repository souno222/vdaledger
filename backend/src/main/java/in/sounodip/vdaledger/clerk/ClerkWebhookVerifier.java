package in.sounodip.vdaledger.clerk;

import com.svix.Webhook;
import com.svix.exceptions.EmptyWebhookSecretException;
import com.svix.exceptions.WebhookVerificationException;
import in.sounodip.vdaledger.common.exception.BadRequestException;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

@Component
public class ClerkWebhookVerifier {

    private final String signingSecret;

    public ClerkWebhookVerifier(ClerkProperties properties) {
        this.signingSecret = properties.webhookSigningSecret();
    }

    public void verify(String rawPayload, HttpHeaders headers) {
        if (signingSecret == null || signingSecret.isBlank()) {
            throw new IllegalStateException(
                    "CLERK_WEBHOOK_SIGNING_SECRET is not configured."
            );
        }

        try {
            new Webhook(signingSecret).verify(rawPayload, headers);
        } catch (WebhookVerificationException exception) {
            throw new BadRequestException(
                    "INVALID_CLERK_WEBHOOK_SIGNATURE",
                    "The Clerk webhook signature is missing, invalid, or expired."
            );
        } catch (EmptyWebhookSecretException exception) {
            throw new IllegalStateException(
                    "The Clerk webhook signing secret is invalid.",
                    exception
            );
        }
    }
}
