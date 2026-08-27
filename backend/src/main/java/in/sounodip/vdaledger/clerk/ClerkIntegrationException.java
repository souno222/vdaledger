package in.sounodip.vdaledger.clerk;

public class ClerkIntegrationException extends RuntimeException {

    public ClerkIntegrationException(String message) {
        super(message);
    }

    public ClerkIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
