FROM maven:3.9.12-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY pom.xml .
RUN mvn --batch-mode -DskipTests dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
RUN addgroup -S vda && adduser -S vda -G vda

COPY --from=build /workspace/target/vda-ledger-0.0.1-SNAPSHOT.jar app.jar

USER vda
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
