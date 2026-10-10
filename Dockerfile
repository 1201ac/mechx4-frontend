# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend JAR
FROM eclipse-temurin:21-jdk-alpine AS backend-builder
WORKDIR /app
COPY backend/mvnw backend/mvnw.cmd ./
COPY backend/.mvn ./.mvn
COPY backend/pom.xml ./
RUN ./mvnw dependency:go-offline -B
COPY backend/src ./src
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static
RUN ./mvnw -DskipTests package

# Stage 3: Production Runner
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
EXPOSE 8080
COPY --from=backend-builder /app/target/nerlogix-backend-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
