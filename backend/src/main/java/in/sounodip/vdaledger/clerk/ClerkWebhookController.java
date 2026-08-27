package in.sounodip.vdaledger.clerk;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.sounodip.vdaledger.common.exception.BadRequestException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks/clerk")
public class ClerkWebhookController {

    private final ClerkWebhookVerifier verifier;
    private final ClerkWebhookService webhookService;
    private final ObjectMapper objectMapper;

    public ClerkWebhookController(
            ClerkWebhookVerifier verifier,
            ClerkWebhookService webhookService,
            ObjectMapper objectMapper
    ) {
        this.verifier = verifier;
        this.webhookService = webhookService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Response> receive(
            @RequestBody String rawPayload,
            @RequestHeader HttpHeaders headers
    ) {
        verifier.verify(rawPayload, headers);
        ClerkWebhookEvent event = readEvent(rawPayload);
        ClerkWebhookService.Result result = webhookService.process(
                headers.getFirst("svix-id"),
                event
        );
        return ResponseEntity.ok(new Response(result.name().toLowerCase()));
    }

    private ClerkWebhookEvent readEvent(String rawPayload) {
        try {
            return objectMapper.readValue(rawPayload, ClerkWebhookEvent.class);
        } catch (JsonProcessingException exception) {
            throw new BadRequestException(
                    "INVALID_CLERK_WEBHOOK_PAYLOAD",
                    "The Clerk webhook payload is not valid JSON."
            );
        }
    }

    public record Response(String status) {
    }
}
