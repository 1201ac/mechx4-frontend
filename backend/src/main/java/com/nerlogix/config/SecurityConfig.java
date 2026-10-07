package com.nerlogix.config;

import com.nerlogix.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/health",
                    "/api/public/**",
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/refresh",
                    "/api/docs/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/error",
                    "/",
                    "/index.html",
                    "/static/**",
                    "/assets/**",
                    "/*.js",
                    "/*.css",
                    "/*.png",
                    "/*.svg",
                    "/*.ico",
                    "/manifest.json"
                ).permitAll()

                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/integrations/**").hasAnyRole("ADMIN", "MODERATOR")

                // Moderator & Admin endpoints
                .requestMatchers(HttpMethod.PATCH, "/api/roads/*/status").hasAnyRole("MODERATOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/field-reports/*/verify").hasAnyRole("MODERATOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/field-reports/*/reject").hasAnyRole("MODERATOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/incidents/*/resolve").hasAnyRole("MODERATOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/alerts/*/ack").hasAnyRole("MODERATOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/alerts/*/resolve").hasAnyRole("MODERATOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/notifications/broadcast").hasAnyRole("MODERATOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/settings/emergency").hasAnyRole("MODERATOR", "ADMIN")

                // Authenticated endpoints for all roles
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
