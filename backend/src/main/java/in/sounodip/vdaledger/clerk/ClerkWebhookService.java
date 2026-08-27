package in.sounodip.vdaledger.clerk;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.user.AppUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;

@Service
public class ClerkWebhookService {

    private static final Logger log = LoggerFactory.getLogger(ClerkWebhookService.class);
    private static final Set<String> UPSERT_EVENTS = Set.of("user.created", "user.updated");

    private final ClerkWebhookDeliveryStore deliveryStore;
    private final AppUserService appUserService;

    public ClerkWebhookService(
            ClerkWebhookDeliveryStore deliveryStore,
            AppUserService appUserService
    ) {
        this.deliveryStore = deliveryStore;
        this.appUserService = appUserService;
    }

    @Transactional
    public Result process(String svixId, ClerkWebhookEvent event) {
        validateEnvelope(svixId, event);
        String clerkUserId = event.data() == null ? null : event.data().id();
        Instant now = Instant.now();

        if (!deliveryStore.claim(svixId, event.type(), clerkUserId, now)) {
            return Result.DUPLICATE;
        }

        Result result;
        if (UPSERT_EVENTS.contains(event.type())) {
            ClerkUserProfile profile = requiredUser(event).toProfile();
            Instant updatedAt = profile.clerkUpdatedAt() == null
                    ? event.timestampInstant()
                    : profile.clerkUpdatedAt();
            if (updatedAt == null) {
                throw invalidPayload("The Clerk user event does not contain an update timestamp.");
            }
            appUserService.synchronize(new ClerkUserProfile(
                    profile.clerkUserId(),
                    profile.primaryEmail(),
                    profile.firstName(),
                    profile.lastName(),
                    profile.imageUrl(),
                    profile.clerkCreatedAt(),
                    updatedAt
            ));
            result = Result.PROCESSED;
        } else if ("user.deleted".equals(event.type())) {
            ClerkUserResponse user = requiredUser(event);
            Instant updatedAt = user.updatedAtInstant() == null
                    ? event.timestampInstant()
                    : user.updatedAtInstant();
            if (updatedAt == null) {
                throw invalidPayload("The Clerk deletion event does not contain a timestamp.");
            }
            appUserService.markDeleted(user.id(), updatedAt);
            result = Result.PROCESSED;
        } else {
            log.info("Ignoring unsupported Clerk webhook event type {}", event.type());
            result = Result.IGNORED;
        }

        deliveryStore.markProcessed(svixId, Instant.now());
        return result;
    }

    private void validateEnvelope(String svixId, ClerkWebhookEvent event) {
        if (svixId == null || svixId.isBlank()) {
            throw invalidPayload("The Clerk webhook delivery ID is missing.");
        }
        if (event == null || event.type() == null || event.type().isBlank()) {
            throw invalidPayload("The Clerk webhook event type is missing.");
        }
    }

    private ClerkUserResponse requiredUser(ClerkWebhookEvent event) {
        if (event.data() == null
                || event.data().id() == null
                || event.data().id().isBlank()) {
            throw invalidPayload("The Clerk webhook user ID is missing.");
        }
        return event.data();
    }

    private BadRequestException invalidPayload(String message) {
        return new BadRequestException("INVALID_CLERK_WEBHOOK_PAYLOAD", message);
    }

    public enum Result {
        PROCESSED,
        DUPLICATE,
        IGNORED
    }
}
