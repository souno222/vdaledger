package in.sounodip.vdaledger.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class RedisRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimiter.class);

    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<Long> script;
    private final int maxRequests;
    private final long windowSeconds;

    public RedisRateLimiter(
            StringRedisTemplate redisTemplate,
            DefaultRedisScript<Long> ingestionRateLimitScript,
            @Value("${app.rate-limit.ingestion.max-requests:10}") int maxRequests,
            @Value("${app.rate-limit.ingestion.window-seconds:60}") long windowSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.script = ingestionRateLimitScript;
        this.maxRequests = Math.max(1, maxRequests);
        this.windowSeconds = Math.max(1, windowSeconds);
    }

    public RateLimitDecision check(UUID userId) {
        long epochSeconds = Instant.now().getEpochSecond();
        long window = epochSeconds / windowSeconds;
        long retryAfter = windowSeconds - (epochSeconds % windowSeconds);
        String key = "rate-limit:ingestion:" + userId + ":" + window;

        try {
            Long count = redisTemplate.execute(
                    script,
                    List.of(key),
                    Long.toString(windowSeconds)
            );
            if (count == null) {
                log.warn("Redis rate-limit script returned no result; failing open");
                return RateLimitDecision.permit();
            }
            return count <= maxRequests
                    ? RateLimitDecision.permit()
                    : RateLimitDecision.rejected(retryAfter);
        } catch (RuntimeException exception) {
            log.warn("Redis rate limiting is unavailable; failing open for ingestion uploads", exception);
            return RateLimitDecision.permit();
        }
    }

    public record RateLimitDecision(boolean allowed, long retryAfterSeconds) {

        public static RateLimitDecision permit() {
            return new RateLimitDecision(true, 0);
        }

        public static RateLimitDecision rejected(long retryAfterSeconds) {
            return new RateLimitDecision(false, Math.max(1, retryAfterSeconds));
        }
    }
}
