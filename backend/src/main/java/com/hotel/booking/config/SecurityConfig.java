package com.hotel.booking.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Cau hinh bao mat Spring Security.
 * - Stateless (khong luu session): phu hop cho REST API + JWT.
 * - Phan quyen: API cong khai (public) va API yeu cau dang nhap (authenticated).
 * - Tich hop JwtAuthenticationFilter de giai ma JWT tren moi request.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Cho phep dung @PreAuthorize("hasRole('ADMIN')") tren tung method
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Tat CSRF vi dung REST API stateless
            .csrf(AbstractHttpConfigurer::disable)
            // Khong tao HTTP Session
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Phan quyen truy cap cac API
            .authorizeHttpRequests(auth -> auth
                // Cac API cong khai: khong can dang nhap
                .requestMatchers(
                    "/api/public/**",
                    "/api/ai/search",
                    "/api/ai/chat"
                ).permitAll()
                // Tat ca request con lai phai co JWT hop le
                .anyRequest().authenticated()
            )
            // Chen JWT Filter truoc filter mac dinh cua Spring
            .addFilterBefore(jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
