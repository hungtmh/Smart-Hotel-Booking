# SKILL 1: THIẾT LẬP SPRING BOOT CORE & SECURITY
## CÁC TIÊU CHUẨN CỐT LÕI ĐƯỢC NHÀ TUYỂN DỤNG ĐÁNH GIÁ CAO

Tài liệu này hướng dẫn cách cấu hình và triển khai các thành phần cốt lõi của một ứng dụng Spring Boot chuyên nghiệp, sạch sẽ (Clean Code) và dễ bảo trì.

---

## 1. CẤU TRÚC THƯ MỤC DỰ ÁN CHUẨN (STANDARD STRUCTURE)

```text
com.hotel.booking
│
├── config                 # Cấu hình Spring Security, Async, CORS...
├── controller             # Điểm nhận Request từ Client (REST Controller)
├── exception              # Xử lý ngoại lệ tập trung (Global Exception Handling)
├── model                  # Các thực thể cơ sở dữ liệu (Entities)
├── repository             # Lớp truy vấn dữ liệu (JPA Repository)
├── service                # Lớp xử lý nghiệp vụ chính (Business Logic)
├── dto                    # Lớp vận chuyển dữ liệu (Request/Response DTO)
└── validation             # Bộ kiểm thực dữ liệu tự chế (Custom Validators)
```

---

## 2. DTO & CUSTOM VALIDATION (KIỂM THỰC DỮ LIỆU TỰ CHẾ)

### 2.1. Annotation kiểm tra khoảng ngày đặt phòng (`@ValidDateRange`)
Để tránh lỗi ngày trả phòng trước ngày nhận phòng, ta tạo một validator tùy chỉnh ở cấp độ Class.

#### [NEW] [ValidDateRange.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/validation/ValidDateRange.java)
```java
package com.hotel.booking.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.TYPE}) // Áp dụng ở cấp độ Class
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = DateRangeValidator.class) // Chỉ định class xử lý logic kiểm tra
@Documented
public @interface ValidDateRange {
    String message() default "Ngày nhận phòng phải trước ngày trả phòng và là ngày trong tương lai";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

#### [NEW] [DateRangeValidator.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/validation/DateRangeValidator.java)
```java
package com.hotel.booking.validation;

import com.hotel.booking.dto.BookingRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;

/**
 * Lớp xử lý logic kiểm thực khoảng ngày đặt phòng.
 * Đảm bảo checkInDate trước checkOutDate và checkInDate >= ngày hiện tại.
 */
public class DateRangeValidator implements ConstraintValidator<ValidDateRange, BookingRequest> {

    @Override
    public boolean isValid(BookingRequest request, ConstraintValidatorContext context) {
        if (request.getCheckInDate() == null || request.getCheckOutDate() == null) {
            return false;
        }
        
        LocalDate today = LocalDate.now();
        
        // Kiểm tra xem ngày nhận phòng có trong quá khứ không
        if (request.getCheckInDate().isBefore(today)) {
            return false;
        }
        
        // Kiểm tra ngày nhận phòng có trước ngày trả phòng không
        return request.getCheckInDate().isBefore(request.getCheckOutDate());
    }
}
```

### 2.2. Khai báo Booking DTO nhận dữ liệu từ client
#### [NEW] [BookingRequest.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/dto/BookingRequest.java)
```java
package com.hotel.booking.dto;

import com.hotel.booking.validation.ValidDateRange;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO nhận thông tin đặt phòng từ Frontend.
 * Annotation @ValidDateRange sẽ kích hoạt validator tự thiết kế ở trên.
 */
@Data
@ValidDateRange
public class BookingRequest {

    @NotNull(message = "ID loại phòng không được để trống")
    private UUID roomTypeId;

    @NotNull(message = "Ngày nhận phòng không được để trống")
    private LocalDate checkInDate;

    @NotNull(message = "Ngày trả phòng không được để trống")
    private LocalDate checkOutDate;
}
```

---

## 3. GLOBAL EXCEPTION HANDLING (XỬ LÝ LỖI TẬP TRUNG)

Giúp kiểm soát toàn bộ lỗi phát sinh trong hệ thống, chuyển đổi thành định dạng JSON chuẩn dễ đọc cho frontend.

### 3.1. Lớp định nghĩa cấu trúc lỗi phản hồi (Error Response)
#### [NEW] [ErrorResponse.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/exception/ErrorResponse.java)
```java
package com.hotel.booking.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Định dạng dữ liệu lỗi thống nhất cho toàn bộ API của hệ thống.
 */
@Data
@AllArgsConstructor
public class ErrorResponse {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
}
```

### 3.2. Class xử lý và bắt lỗi chung
#### [NEW] [GlobalExceptionHandler.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/exception/GlobalExceptionHandler.java)
```java
package com.hotel.booking.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Bộ bắt lỗi toàn cục. Tự động can thiệp khi có Exception ném ra từ Controller/Service.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Bắt các lỗi validate dữ liệu đầu vào (ví dụ các thuộc tính đánh dấu @NotNull, @Size...)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        
        // Ghép các thông điệp lỗi validation lại thành 1 chuỗi văn bản duy nhất
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        log.warn("Validation failed for request {}: {}", request.getRequestURI(), errorMessage);

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request - Validation Error",
                errorMessage,
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Bắt lỗi không tìm thấy tài nguyên (ResourceNotFoundException tự định nghĩa)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        
        log.error("Resource not found exception: {}", ex.getMessage());

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /**
     * Bắt các lỗi hệ thống không lường trước được (lỗi 500)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(
            Exception ex, HttpServletRequest request) {
        
        log.error("An unexpected error occurred at {}: ", request.getRequestURI(), ex);

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "Đã có lỗi xảy ra phía máy chủ. Vui lòng thử lại sau.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

---

## 4. SPRING SECURITY & INTEGRATING SUPABASE JWT

Khi khách hàng đăng nhập thành công qua Supabase ở Frontend, Supabase sẽ cấp 1 mã Access Token (dạng JWT) đã ký bằng khóa bí mật. Client sẽ gửi token này trong Header `Authorization: Bearer <token>`. Spring Boot sẽ giải mã token này để xác thực người dùng mà không cần lưu Session.

### 4.1. Lớp lọc JWT (JwtAuthenticationFilter)
#### [NEW] [JwtAuthenticationFilter.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/config/JwtAuthenticationFilter.java)
```java
package com.hotel.booking.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Collections;
import java.util.List;

/**
 * Filter chặn các request gửi lên để kiểm tra và giải mã mã thông báo JWT từ Supabase.
 */
@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${supabase.jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            String jwt = getJwtFromRequest(request);

            if (jwt != null && validateAndAuthenticate(jwt, request)) {
                log.debug("JWT successfully authenticated for request: {}", request.getRequestURI());
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Lấy token JWT từ Header 'Authorization'
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Giải mã Token, kiểm tra tính hợp lệ và thiết lập người dùng vào Security Context.
     */
    private boolean validateAndAuthenticate(String token, HttpServletRequest request) {
        // Tạo khóa bí mật từ chuỗi cấu hình (Supabase JWT Secret)
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        // Giải mã JWT Token
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        // Lấy Subject (Chính là UUID của người dùng trên Supabase)
        String userId = claims.getSubject();
        
        // Đọc phân quyền (Role) của người dùng từ custom claim 'role' (hoặc mặc định là USER)
        String role = claims.get("role", String.class);
        if (role == null) {
            role = "ROLE_USER"; 
        } else if (!role.startsWith("ROLE_")) {
            role = "ROLE_" + role.toUpperCase();
        }

        if (userId != null) {
            List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
            
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId, null, authorities);
            
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            
            // Đặt thông tin xác thực vào Security Context của Spring
            SecurityContextHolder.getContext().setAuthentication(authentication);
            return true;
        }
        
        return false;
    }
}
```

### 4.2. Cấu hình bảo mật Spring Security
#### [NEW] [SecurityConfig.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/config/SecurityConfig.java)
```java
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
 * Cấu hình bảo mật phân quyền API của ứng dụng.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Cho phép phân quyền ở mức Method ví dụ @PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Tắt CSRF vì ứng dụng là REST API stateless
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Cho phép truy cập tự do vào các tài nguyên tĩnh và các API tìm kiếm phòng/chat
                .requestMatchers("/api/public/**", "/api/ai/search", "/api/ai/chat").permitAll()
                // Tất cả các request khác yêu cầu phải được xác thực bằng JWT
                .anyRequest().authenticated()
            )
            // Thêm JwtAuthenticationFilter vào trước UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## 5. ASYNCHRONOUS PROCESSING (XỬ LÝ BẤT ĐỒNG BỘ)

Khi đặt phòng thành công, việc gửi email thông báo hoặc ghi nhận các tác vụ phân tích phụ có thể thực hiện ngầm để tránh bắt người dùng phải đợi lâu trên màn hình.

### 5.1. Bật tính năng Async ở tầng cấu hình
#### [NEW] [AsyncConfig.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/config/AsyncConfig.java)
```java
package com.hotel.booking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Kích hoạt cơ chế xử lý đa luồng bất đồng bộ của Spring Boot.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring Boot sẽ tự động quản lý luồng bằng ThreadPoolTaskExecutor mặc định
}
```

### 5.2. Hàm gửi thông báo chạy bất đồng bộ
#### [NEW] [NotificationService.java](file:///d:/Smart-Hotel-Booking/src/main/java/com/hotel/booking/service/NotificationService.java)
```java
package com.hotel.booking.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Dịch vụ xử lý gửi thông báo độc lập bằng một luồng phụ (Thread riêng biệt).
 */
@Service
@Slf4j
public class NotificationService {

    /**
     * Hàm này sẽ chạy ngầm dưới nền mà không khóa luồng xử lý chính của HTTP Request.
     */
    @Async
    public void sendBookingConfirmationEmail(String email, String bookingId) {
        log.info("Bắt đầu gửi email xác nhận đặt phòng {} cho email: {}", bookingId, email);
        try {
            // Giả lập thời gian kết nối server mail mất 3 giây
            Thread.sleep(3000); 
            log.info("Đã gửi email thành công cho: {}", email);
        } catch (InterruptedException e) {
            log.error("Lỗi khi đang gửi email bất đồng bộ: ", e);
            Thread.currentThread().interrupt();
        }
    }
}
```
