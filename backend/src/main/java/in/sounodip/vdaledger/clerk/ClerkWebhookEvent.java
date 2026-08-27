package in.sounodip.vdaledger.clerk;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClerkWebhookEvent(
        String type,
        Long timestamp,
        ClerkUserResponse data
) {

    public Instant timestampInstant() {
        return timestamp == null ? null : Instant.ofEpochMilli(timestamp);
    }
}
