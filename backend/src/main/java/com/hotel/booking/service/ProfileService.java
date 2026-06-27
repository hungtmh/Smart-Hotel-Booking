package com.hotel.booking.service;

import com.hotel.booking.dto.ProfileResponse;
import com.hotel.booking.exception.ResourceNotFoundException;
import com.hotel.booking.model.Profile;
import com.hotel.booking.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * Service xu ly nghiep vu lien quan den ho so nguoi dung (Profile).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final ProfileRepository profileRepository;

    /**
     * Lay thong tin profile cua user dang dang nhap theo userId tu JWT.
     *
     * @param userId UUID cua user (lay tu SecurityContext)
     * @return ProfileResponse chua thong tin profile
     * @throws ResourceNotFoundException neu khong tim thay profile
     */
    @Transactional
    public ProfileResponse getProfileByUserId(String userId) {
        log.info("Truy van profile cho userId: {}", userId);

        Profile profile = profileRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> {
                    log.error("Khong tim thay profile voi userId: {}", userId);
                    return new ResourceNotFoundException("Khong tim thay profile cho user: " + userId);
                });

        // Tu dong dong bo hoa vai tro ADMIN tu JWT token xuong DB neu chua khop
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean hasAdminRole = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (hasAdminRole && "USER".equals(profile.getRole())) {
            profile.setRole("ADMIN");
            profile = profileRepository.save(profile);
            log.info("Da tu dong dong bo quyen ADMIN tu JWT Token xuong profiles DB cho userId: {}", userId);
        }

        return new ProfileResponse(
                profile.getId().toString(),
                profile.getFullName(),
                profile.getPhoneNumber(),
                profile.getAvatarUrl(),
                profile.getRole(),
                profile.getLoyaltyTier(),
                profile.getLoyaltyPoints()
        );
    }
}
