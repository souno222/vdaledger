package in.sounodip.vdaledger.user;

import in.sounodip.vdaledger.security.CurrentUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Authenticated Clerk user profile")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final CurrentUserService currentUserService;

    public UserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get the current user", description = "Lazily provisions and returns the internal user mapped from the verified Clerk JWT subject.")
    public CurrentUserResponse currentUser() {
        return CurrentUserResponse.from(currentUserService.getCurrentUser());
    }
}
