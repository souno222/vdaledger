package in.sounodip.vdaledger.user;

import java.time.Instant;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String clerkUserId,
        String email,
        Instant createdAt
) {

    public static CurrentUserResponse from(AppUser user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getClerkUserId(),
                user.getEmail(),
                user.getCreatedAt()
        );
    }
}
