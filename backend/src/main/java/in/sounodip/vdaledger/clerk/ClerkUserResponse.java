package in.sounodip.vdaledger.clerk;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClerkUserResponse(
        String id,
        @JsonProperty("primary_email_address_id") String primaryEmailAddressId,
        @JsonProperty("email_addresses") List<EmailAddress> emailAddresses,
        @JsonProperty("first_name") String firstName,
        @JsonProperty("last_name") String lastName,
        @JsonProperty("image_url") String imageUrl,
        @JsonProperty("created_at") Long createdAt,
        @JsonProperty("updated_at") Long updatedAt
) {

    public ClerkUserProfile toProfile() {
        String primaryEmail = emailAddresses == null
                ? null
                : emailAddresses.stream()
                .filter(email -> Objects.equals(email.id(), primaryEmailAddressId))
                .map(EmailAddress::emailAddress)
                .findFirst()
                .orElse(null);

        return new ClerkUserProfile(
                id,
                primaryEmail,
                firstName,
                lastName,
                imageUrl,
                instant(createdAt),
                instant(updatedAt)
        );
    }

    public Instant updatedAtInstant() {
        return instant(updatedAt);
    }

    private Instant instant(Long epochMilliseconds) {
        return epochMilliseconds == null ? null : Instant.ofEpochMilli(epochMilliseconds);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EmailAddress(
            String id,
            @JsonProperty("email_address") String emailAddress
    ) {
    }
}
