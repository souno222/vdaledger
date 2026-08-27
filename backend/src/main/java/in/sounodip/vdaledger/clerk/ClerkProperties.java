package in.sounodip.vdaledger.clerk;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;

@ConfigurationProperties(prefix = "app.clerk")
public record ClerkProperties(
        String secretKey,
        String webhookSigningSecret,
        URI backendApiUrl
) {
}
