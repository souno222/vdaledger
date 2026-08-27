package in.sounodip.vdaledger.clerk;

import java.time.Instant;

public record ClerkUserProfile(
        String clerkUserId,
        String primaryEmail,
        String firstName,
        String lastName,
        String imageUrl,
        Instant clerkCreatedAt,
        Instant clerkUpdatedAt
) {
}
