package com.hotel.booking.controller;

import com.hotel.booking.dto.ProfileResponse;
import com.hotel.booking.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xac thuc va quan ly thong tin nguoi dung dang nhap.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final ProfileService profileService;

    /**
     * Lay thong tin profile cua user dang dang nhap (can JWT token).
     * URL: GET /api/auth/me
     *
     * @param authentication doi tuong xac thuc tu Spring Security Context
     * @return ProfileResponse chua thong tin nguoi dung
     */
    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getCurrentUser(Authentication authentication) {
        // authentication.getName() tra ve userId (Subject trong JWT)
        String userId = authentication.getName();
        ProfileResponse profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(profile);
    }
}
