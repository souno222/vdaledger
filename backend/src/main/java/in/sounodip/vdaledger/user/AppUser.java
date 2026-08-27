package in.sounodip.vdaledger.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    private UUID id;

    @Column(name = "clerk_user_id", nullable = false, unique = true, length = 128)
    private String clerkUserId;

    @Column(length = 320)
    private String email;

    @Column(name = "first_name", length = 255)
    private String firstName;

    @Column(name = "last_name", length = 255)
    private String lastName;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "clerk_created_at")
    private Instant clerkCreatedAt;

    @Column(name = "clerk_updated_at")
    private Instant clerkUpdatedAt;

    @Column(name = "clerk_synced_at")
    private Instant clerkSyncedAt;

    @Column(name = "clerk_deleted", nullable = false)
    private boolean clerkDeleted;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AppUser() {
    }

    public AppUser(String clerkUserId, String email) {
        this.id = UUID.randomUUID();
        this.clerkUserId = Objects.requireNonNull(clerkUserId, "clerkUserId");
        this.email = email;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void updateEmail(String email) {
        this.email = email;
    }

    public UUID getId() {
        return id;
    }

    public String getClerkUserId() {
        return clerkUserId;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Instant getClerkCreatedAt() {
        return clerkCreatedAt;
    }

    public Instant getClerkUpdatedAt() {
        return clerkUpdatedAt;
    }

    public Instant getClerkSyncedAt() {
        return clerkSyncedAt;
    }

    public boolean isClerkDeleted() {
        return clerkDeleted;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
