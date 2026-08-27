package in.sounodip.vdaledger.user;

import in.sounodip.vdaledger.clerk.ClerkBackendClient;
import in.sounodip.vdaledger.clerk.ClerkUserProfile;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AppUserServiceTest {

    @Test
    void existingUserIsReadLocallyWithoutCallingClerk() {
        AppUserRepository repository = mock(AppUserRepository.class);
        ClerkBackendClient client = mock(ClerkBackendClient.class);
        AppUser existing = new AppUser("user_existing", "local@example.com");
        when(repository.findByClerkUserId("user_existing"))
                .thenReturn(Optional.of(existing));
        AppUserService service = new AppUserService(repository, client);

        AppUser result = service.getOrCreate("user_existing");

        assertThat(result).isSameAs(existing);
        verify(client, never()).getUser(any());
    }

    @Test
    void missingUserIsFetchedFromClerkAndUpserted() {
        AppUserRepository repository = mock(AppUserRepository.class);
        ClerkBackendClient client = mock(ClerkBackendClient.class);
        AppUser synchronizedUser =
                new AppUser("user_missing", "primary@example.com");
        ClerkUserProfile profile = new ClerkUserProfile(
                "user_missing",
                "primary@example.com",
                "Asha",
                "Rao",
                null,
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-02T00:00:00Z")
        );
        when(repository.findByClerkUserId("user_missing"))
                .thenReturn(Optional.empty(), Optional.of(synchronizedUser));
        when(client.getUser("user_missing")).thenReturn(profile);
        AppUserService service = new AppUserService(repository, client);

        AppUser result = service.getOrCreate("user_missing");

        assertThat(result).isSameAs(synchronizedUser);
        verify(client).getUser("user_missing");
        verify(repository).upsertFromClerk(
                any(),
                eq("user_missing"),
                eq("primary@example.com"),
                eq("Asha"),
                eq("Rao"),
                isNull(),
                eq(profile.clerkCreatedAt()),
                eq(profile.clerkUpdatedAt()),
                any()
        );
    }
}
