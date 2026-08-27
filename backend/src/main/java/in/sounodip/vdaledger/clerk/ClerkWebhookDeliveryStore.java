package in.sounodip.vdaledger.clerk;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;

@Repository
public class ClerkWebhookDeliveryStore {

    private final JdbcTemplate jdbcTemplate;

    public ClerkWebhookDeliveryStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean claim(
            String svixId,
            String eventType,
            String clerkUserId,
            Instant receivedAt
    ) {
        int inserted = jdbcTemplate.update("""
                INSERT INTO clerk_webhook_deliveries (
                    svix_id,
                    event_type,
                    clerk_user_id,
                    received_at
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT (svix_id) DO NOTHING
                """, svixId, eventType, clerkUserId, Timestamp.from(receivedAt));
        return inserted == 1;
    }

    public void markProcessed(String svixId, Instant processedAt) {
        jdbcTemplate.update("""
                UPDATE clerk_webhook_deliveries
                SET processed_at = ?
                WHERE svix_id = ?
                """, Timestamp.from(processedAt), svixId);
    }
}
