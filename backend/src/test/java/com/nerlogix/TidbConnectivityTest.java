package com.nerlogix;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import static org.assertj.core.api.Assertions.assertThat;

@Disabled("Integration test against TiDB Cloud; enable with RUN_TIDB_INTEGRATION_TEST=true and DB_PASSWORD")
@EnabledIfEnvironmentVariable(named = "RUN_TIDB_INTEGRATION_TEST", matches = "true")
class TidbConnectivityTest {

    @Test
    void testTiDbConnectionAndFlywayMigration() {
        String dbPassword = System.getenv("DB_PASSWORD");
        if (dbPassword == null || dbPassword.isBlank()) {
            dbPassword = System.getenv("SPRING_DATASOURCE_PASSWORD");
        }
        if (dbPassword == null || dbPassword.isBlank()) {
            System.out.println("DB_PASSWORD not set. Skipping live TiDB connectivity check.");
            return;
        }

        String username = System.getenv("SPRING_DATASOURCE_USERNAME");
        if (username == null || username.isBlank()) {
            username = "3KQW41Z7XRUm1xM.root";
        }

        String dbName = System.getenv("SPRING_DATASOURCE_DATABASE");
        if (dbName == null || dbName.isBlank()) {
            dbName = "sys";
        }

        String host = System.getenv("SPRING_DATASOURCE_HOST");
        if (host == null || host.isBlank()) {
            host = "gateway01.ap-northeast-1.prod.aws.tidbcloud.com";
        }

        String port = System.getenv("SPRING_DATASOURCE_PORT");
        if (port == null || port.isBlank()) {
            port = "4000";
        }

        String targetUrl = "jdbc:mysql://" + host + ":" + port + "/" + dbName
                + "?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3";

        System.out.println("Testing connectivity to TiDB Cloud host: " + host + ":" + port + "/" + dbName);
        try (Connection conn = DriverManager.getConnection(targetUrl, username, dbPassword);
             Statement stmt = conn.createStatement()) {

            try (ResultSet rs = stmt.executeQuery("SELECT VERSION()")) {
                if (rs.next()) {
                    System.out.println("Connected successfully! TiDB Version: " + rs.getString(1));
                }
            }

            try (ResultSet rs = stmt.executeQuery("SELECT CURRENT_USER(), DATABASE()")) {
                if (rs.next()) {
                    System.out.println("Current User: " + rs.getString(1) + ", Current DB: " + rs.getString(2));
                }
            }

            try (ResultSet rs = stmt.executeQuery("SHOW DATABASES")) {
                System.out.println("Available databases:");
                while (rs.next()) {
                    System.out.println(" - " + rs.getString(1));
                }
            }

            try (ResultSet rs = stmt.executeQuery("SHOW TABLES")) {
                System.out.println("Existing tables in " + dbName + ":");
                int count = 0;
                while (rs.next()) {
                    System.out.println(" - " + rs.getString(1));
                    count++;
                }
                if (count == 0) {
                    System.out.println(" (No tables found in " + dbName + ")");
                }
            }

            try (ResultSet rs = stmt.executeQuery("SHOW GRANTS FOR CURRENT_USER()")) {
                System.out.println("Grants for current user:");
                while (rs.next()) {
                    System.out.println(" - " + rs.getString(1));
                }
            }

            System.out.println("Testing CREATE DATABASE IF NOT EXISTS mechx4...");
            try {
                stmt.execute("CREATE DATABASE IF NOT EXISTS mechx4");
                System.out.println("SUCCESS: Database 'mechx4' created or already exists!");
            } catch (Exception e) {
                System.err.println("CREATE DATABASE failed: " + e.getMessage());
            }

            // Check permissions in mechx4 or test
            String appDb = "mechx4";
            String appDbUrl = "jdbc:mysql://" + host + ":" + port + "/" + appDb
                    + "?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3";

            try (Connection appConn = DriverManager.getConnection(appDbUrl, username, dbPassword);
                 Statement appStmt = appConn.createStatement()) {

                System.out.println("Connected to " + appDb + "! Testing table creation...");
                appStmt.execute("CREATE TABLE IF NOT EXISTS test_ping (id INT PRIMARY KEY)");
                System.out.println("SUCCESS: Table creation succeeded in " + appDb + "!");
                appStmt.execute("DROP TABLE IF EXISTS test_ping");

                System.out.println("Running Flyway migration in " + appDb + "...");
                Flyway flyway = Flyway.configure()
                        .dataSource(appDbUrl, username, dbPassword)
                        .baselineOnMigrate(false)
                        .locations("classpath:db/migration")
                        .cleanDisabled(true)
                        .load();

                flyway.migrate();
                System.out.println("SUCCESS: Flyway migration completed successfully in " + appDb + "!");

                try (ResultSet rs = appStmt.executeQuery("SHOW TABLES")) {
                    System.out.println("Tables now in " + appDb + ":");
                    while (rs.next()) {
                        System.out.println(" - " + rs.getString(1));
                    }
                }
            }

        } catch (Exception e) {
            System.err.println("TiDB connectivity test failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }
}
