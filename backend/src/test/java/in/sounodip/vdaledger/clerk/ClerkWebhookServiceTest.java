package in.sounodip.vdaledger.clerk;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.user.AppUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ClerkWebhookServiceTest {

    private ClerkWebhookDeliveryStore deliveryStore;
    private AppUserService appUserService;
    private ClerkWebhookService service;

    @BeforeEach
    void setUp() {
        deliveryStore = mock(ClerkWebhookDeliveryStore.class);
        appUserService = mock(AppUserService.class);
        service = new ClerkWebhookService(deliveryStore, appUserService);
    }

    @Test
    void synchronizesCreatedUserWithPrimaryEmail() {
        when(deliveryStore.claim(eq("msg_created"), any(), any(), any()))
                .thenReturn(true);

        ClerkWebhookService.Result result = service.process(
                "msg_created",
                event("user.created", 1710000005000L)
        );

        ArgumentCaptor<ClerkUserProfile> profile =
                ArgumentCaptor.forClass(ClerkUserProfile.class);
        verify(appUserService).synchronize(profile.capture());
        assertThat(profile.getValue().primaryEmail()).isEqualTo("primary@example.com");
        assertThat(profile.getValue().clerkUpdatedAt())
                .isEqualTo(Instant.ofEpochMilli(1710000005000L));
        verify(deliveryStore).markProcessed(eq("msg_created"), any());
        assertThat(result).isEqualTo(ClerkWebhookService.Result.PROCESSED);
    }

    @Test
    void duplicateDeliveryDoesNotTouchTheUser() {
        when(deliveryStore.claim(eq("msg_duplicate"), any(), any(), any()))
                .thenReturn(false);

        ClerkWebhookService.Result result = service.process(
                "msg_duplicate",
                event("user.updated", 1710000005000L)
        );

        verifyNoInteractions(appUserService);
        verify(deliveryStore, never()).markProcessed(any(), any());
        assertThat(result).isEqualTo(ClerkWebhookService.Result.DUPLICATE);
    }

    @Test
    void deletionUsesEnvelopeTimestampWhenDeletedObjectHasNoUpdatedAt() {
        when(deliveryStore.claim(eq("msg_deleted"), any(), any(), any()))
                .thenReturn(true);
        ClerkWebhookEvent event = new ClerkWebhookEvent(
                "user.deleted",
                1710000009000L,
                new ClerkUserResponse(
                        "user_123",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
                )
        );

        service.process("msg_deleted", event);

        verify(appUserService).markDeleted(
                "user_123",
                Instant.ofEpochMilli(1710000009000L)
        );
    }

    @Test
    void malformedKnownEventIsRejectedAndTransactionCanRollBackClaim() {
        when(deliveryStore.claim(eq("msg_invalid"), any(), any(), any()))
                .thenReturn(true);
        ClerkWebhookEvent event = new ClerkWebhookEvent(
                "user.updated",
                1710000009000L,
                null
        );

        assertThatThrownBy(() -> service.process("msg_invalid", event))
                .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(appUserService);
    }

    private ClerkWebhookEvent event(String type, long updatedAt) {
        return new ClerkWebhookEvent(
                type,
                updatedAt,
                new ClerkUserResponse(
                        "user_123",
                        "idn_primary",
                        List.of(
                                new ClerkUserResponse.EmailAddress(
                                        "idn_secondary",
                                        "secondary@example.com"
                                ),
                                new ClerkUserResponse.EmailAddress(
                                        "idn_primary",
                                        "primary@example.com"
                                )
                        ),
                        "Asha",
                        "Rao",
                        "https://img.clerk.test/user.png",
                        1710000000000L,
                        updatedAt
                )
        );
    }
}
