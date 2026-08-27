package in.sounodip.vdaledger.security;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import in.sounodip.vdaledger.user.AppUser;
import in.sounodip.vdaledger.user.AppUserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final AppUserService appUserService;

    public CurrentUserService(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    public AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)
                || !authentication.isAuthenticated()) {
            throw new BadRequestException(
                    "AUTHENTICATED_USER_UNAVAILABLE",
                    "The authenticated user could not be resolved."
            );
        }

        String clerkUserId = jwtAuthentication.getToken().getSubject();
        if (clerkUserId == null || clerkUserId.isBlank()) {
            throw new BadRequestException(
                    "INVALID_JWT_SUBJECT",
                    "The authenticated token does not contain a valid subject."
            );
        }

        return appUserService.getOrCreate(clerkUserId);
    }
}
