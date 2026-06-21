package com.hotel.booking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình chia sẻ tài nguyên nguồn gốc chéo (CORS).
 * Cho phép Frontend React gọi API đến Spring Boot một cách an toàn.
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**") // Áp dụng cho toàn bộ đường dẫn API
                        .allowedOrigins("http://localhost:5173") // Chỉ cho phép React Frontend dev server
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Các HTTP Method được phép
                        .allowedHeaders("*") // Chấp nhận tất cả header
                        .allowCredentials(true); // Cho phép đính kèm credentials (cookies, auth headers)
            }
        };
    }
}
