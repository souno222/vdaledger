package in.sounodip.vdaledger.user;

import in.sounodip.vdaledger.clerk.ClerkBackendClient;
import in.sounodip.vdaledger.clerk.ClerkIntegrationException;
import in.sounodip.vdaledger.clerk.ClerkUserProfile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AppUserService {

    private final AppUserRepository appUserRepository;
    private final ClerkBackendClient clerkBackendClient;

    public AppUserService(
            AppUserRepository appUserRepository,
            ClerkBackendClient clerkBackendClient
    ) {
        this.appUserRepository = appUserRepository;
        this.clerkBackendClient = clerkBackendClient;
    }

    @Transactional
    public AppUser getOrCreate(String clerkUserId) {
        return appUserRepository.findByClerkUserId(clerkUserId)
                .filter(user -> !user.isClerkDeleted())
                .orElseGet(() -> synchronize(clerkBackendClient.getUser(clerkUserId)));
    }

    @Transactional
    public AppUser synchronize(ClerkUserProfile profile) {
        Instant syncedAt = Instant.now();
        appUserRepository.upsertFromClerk(
                UUID.randomUUID(),
                profile.clerkUserId(),
                profile.primaryEmail(),
                profile.firstName(),
                profile.lastName(),
                profile.imageUrl(),
                profile.clerkCreatedAt(),
                profile.clerkUpdatedAt(),
                syncedAt
        );
        return appUserRepository.findByClerkUserId(profile.clerkUserId())
                .orElseThrow(() -> new ClerkIntegrationException(
                        "The synchronized Clerk user could not be loaded."
                ));
    }

    @Transactional
    public void markDeleted(String clerkUserId, Instant clerkUpdatedAt) {
        appUserRepository.markDeletedFromClerk(
                UUID.randomUUID(),
                clerkUserId,
                clerkUpdatedAt,
                Instant.now()
        );
    }
}
