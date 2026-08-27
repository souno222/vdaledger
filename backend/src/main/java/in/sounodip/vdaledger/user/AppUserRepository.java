package in.sounodip.vdaledger.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByClerkUserId(String clerkUserId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO app_users (
                id,
                clerk_user_id,
                email,
                first_name,
                last_name,
                image_url,
                clerk_created_at,
                clerk_updated_at,
                clerk_synced_at,
                clerk_deleted,
                deleted_at,
                created_at,
                updated_at
            ) VALUES (
                :id,
                :clerkUserId,
                :email,
                :firstName,
                :lastName,
                :imageUrl,
                :clerkCreatedAt,
                :clerkUpdatedAt,
                :syncedAt,
                FALSE,
                NULL,
                :syncedAt,
                :syncedAt
            )
            ON CONFLICT (clerk_user_id) DO UPDATE SET
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                image_url = EXCLUDED.image_url,
                clerk_created_at = COALESCE(app_users.clerk_created_at, EXCLUDED.clerk_created_at),
                clerk_updated_at = EXCLUDED.clerk_updated_at,
                clerk_synced_at = EXCLUDED.clerk_synced_at,
                clerk_deleted = FALSE,
                deleted_at = NULL,
                updated_at = EXCLUDED.updated_at
            WHERE app_users.clerk_updated_at IS NULL
               OR (
                    EXCLUDED.clerk_updated_at IS NOT NULL
                    AND EXCLUDED.clerk_updated_at >= app_users.clerk_updated_at
               )
            """, nativeQuery = true)
    int upsertFromClerk(
            @Param("id") UUID id,
            @Param("clerkUserId") String clerkUserId,
            @Param("email") String email,
            @Param("firstName") String firstName,
            @Param("lastName") String lastName,
            @Param("imageUrl") String imageUrl,
            @Param("clerkCreatedAt") Instant clerkCreatedAt,
            @Param("clerkUpdatedAt") Instant clerkUpdatedAt,
            @Param("syncedAt") Instant syncedAt
    );

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO app_users (
                id,
                clerk_user_id,
                email,
                clerk_updated_at,
                clerk_synced_at,
                clerk_deleted,
                deleted_at,
                created_at,
                updated_at
            ) VALUES (
                :id,
                :clerkUserId,
                NULL,
                :clerkUpdatedAt,
                :syncedAt,
                TRUE,
                :syncedAt,
                :syncedAt,
                :syncedAt
            )
            ON CONFLICT (clerk_user_id) DO UPDATE SET
                clerk_updated_at = COALESCE(EXCLUDED.clerk_updated_at, app_users.clerk_updated_at),
                clerk_synced_at = EXCLUDED.clerk_synced_at,
                clerk_deleted = TRUE,
                deleted_at = EXCLUDED.deleted_at,
                updated_at = EXCLUDED.updated_at
            WHERE app_users.clerk_updated_at IS NULL
               OR EXCLUDED.clerk_updated_at IS NULL
               OR EXCLUDED.clerk_updated_at >= app_users.clerk_updated_at
            """, nativeQuery = true)
    int markDeletedFromClerk(
            @Param("id") UUID id,
            @Param("clerkUserId") String clerkUserId,
            @Param("clerkUpdatedAt") Instant clerkUpdatedAt,
            @Param("syncedAt") Instant syncedAt
    );
}
