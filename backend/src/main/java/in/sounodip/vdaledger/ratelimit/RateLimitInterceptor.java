package in.sounodip.vdaledger.ratelimit;

import in.sounodip.vdaledger.common.exception.RateLimitExceededException;
import in.sounodip.vdaledger.security.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RedisRateLimiter redisRateLimiter;
    private final CurrentUserService currentUserService;

    public RateLimitInterceptor(
            RedisRateLimiter redisRateLimiter,
            CurrentUserService currentUserService
    ) {
        this.redisRateLimiter = redisRateLimiter;
        this.currentUserService = currentUserService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        if (!HttpMethod.POST.matches(request.getMethod())
                || !"/api/ingestions".equals(request.getRequestURI())) {
            return true;
        }

        RedisRateLimiter.RateLimitDecision decision = redisRateLimiter.check(
                currentUserService.getCurrentUser().getId()
        );
        if (!decision.allowed()) {
            throw new RateLimitExceededException(decision.retryAfterSeconds());
        }
        return true;
    }
}
