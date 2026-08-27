package in.sounodip.vdaledger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class VdaLedgerApplication {

    public static void main(String[] args) {
        SpringApplication.run(VdaLedgerApplication.class, args);
    }
}
