package in.sounodip.vdaledger.ingestion;

import in.sounodip.vdaledger.common.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class CsvStrategyFactory {

    private final Map<ExchangeType, ExchangeCsvStrategy> strategies;

    public CsvStrategyFactory(List<ExchangeCsvStrategy> strategies) {
        Map<ExchangeType, ExchangeCsvStrategy> indexed = strategies.stream()
                .collect(Collectors.toMap(
                        ExchangeCsvStrategy::supportedExchange,
                        Function.identity(),
                        (first, second) -> {
                            throw new IllegalStateException(
                                    "Multiple CSV strategies registered for " + first.supportedExchange()
                            );
                        },
                        () -> new EnumMap<>(ExchangeType.class)
                ));
        this.strategies = Map.copyOf(indexed);
    }

    public ExchangeCsvStrategy getStrategy(ExchangeType exchange) {
        ExchangeCsvStrategy strategy = strategies.get(exchange);
        if (strategy == null) {
            throw new BadRequestException(
                    "UNSUPPORTED_EXCHANGE",
                    "CSV ingestion is not supported for exchange " + exchange + "."
            );
        }
        return strategy;
    }
}
