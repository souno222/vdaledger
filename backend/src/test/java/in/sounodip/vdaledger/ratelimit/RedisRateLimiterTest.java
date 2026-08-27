package in.sounodip.vdaledger.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RedisRateLimiterTest {

    private final StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
    private final DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    private final RedisRateLimiter limiter = new RedisRateLimiter(redisTemplate, script, 10, 60);

    @Test
    void allowsRequestsAtConfiguredLimit() {
        when(redisTemplate.execute(eq(script), anyList(), eq("60"))).thenReturn(10L);

        assertThat(limiter.check(UUID.randomUUID()).allowed()).isTrue();
    }

    @Test
    void rejectsRequestsBeyondConfiguredLimitWithRetryAfter() {
        when(redisTemplate.execute(eq(script), anyList(), eq("60"))).thenReturn(11L);

        RedisRateLimiter.RateLimitDecision decision = limiter.check(UUID.randomUUID());

        assertThat(decision.allowed()).isFalse();
        assertThat(decision.retryAfterSeconds()).isBetween(1L, 60L);
    }

    @Test
    void failsOpenWhenRedisIsUnavailable() {
        when(redisTemplate.execute(eq(script), anyList(), eq("60")))
                .thenThrow(new RedisConnectionFailureException("unavailable"));

        assertThat(limiter.check(UUID.randomUUID()).allowed()).isTrue();
    }
}
