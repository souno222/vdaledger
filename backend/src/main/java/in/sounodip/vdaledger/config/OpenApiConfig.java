package in.sounodip.vdaledger.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI vdaLedgerOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("VDA Ledger API")
                        .version("1.0.0")
                        .description("""
                                Secure cryptocurrency ledger and Indian VDA tax estimation API.

                                Authentication uses a Clerk session JWT in the Authorization: Bearer header.
                                Binance and CoinDCX INR BUY/SELL CSV uploads are supported.
                                Ingestion states are PENDING, PROCESSING, COMPLETED, COMPLETED_WITH_ERRORS, and FAILED.

                                MVP limitations: only Binance and CoinDCX INR BUY/SELL spot/Insta trades are supported. The API does
                                not provide live prices, swaps, staking/mining/reward/airdrop handling, unrealized
                                gains, USDT-to-INR conversion, actual TDS-credit reconciliation, surcharge
                                calculation, tax-return filing, or multiple tax jurisdictions.

                                Tax output is an educational estimate and is not financial, tax-filing, or legal advice.
                                """))
                .components(new Components().addSecuritySchemes(
                        "bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Clerk session JWT")
                ));
    }
}
