package in.sounodip.vdaledger.common.exception;

public class InsufficientAssetBalanceException extends RuntimeException {

    private final String code;

    public InsufficientAssetBalanceException(String message) {
        super(message);
        this.code = "INSUFFICIENT_ASSET_BALANCE";
    }

    public String getCode() {
        return code;
    }
}
