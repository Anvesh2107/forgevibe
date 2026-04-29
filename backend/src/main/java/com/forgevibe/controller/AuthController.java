package com.forgevibe.controller;

import com.forgevibe.dto.request.LoginRequest;
import com.forgevibe.dto.response.UserResponse;
import com.forgevibe.entity.User;
import com.forgevibe.repository.ProjectDiamondRepository;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final SessionUser sessionUser;
    private final ProjectDiamondRepository diamondRepo;

    @Value("${app.demo-login-enabled:false}")
    private boolean demoLoginEnabled;

    /** POST /api/auth/login-demo   body: { "userId": 1 } — only enabled when DEMO_LOGIN_ENABLED=true */
    @PostMapping("/login-demo")
    public ResponseEntity<?> loginDemo(@Valid @RequestBody LoginRequest req, HttpSession session) {
        if (!demoLoginEnabled) {
            return ResponseEntity.status(403).body(Map.of("error", "Demo login is disabled"));
        }
        try {
            User user = userService.getById(req.getUserId());
            sessionUser.set(session, user);
            return ResponseEntity.ok(userService.toResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
    }

    /** GET /api/auth/me */
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Not logged in"));
        User user = userService.getById(userId);
        LocalDateTime weekStart = LocalDateTime.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toLocalDate().atStartOfDay();
        boolean hasDiamondThisWeek = diamondRepo.existsByUserAndCreatedAtAfter(user, weekStart);
        return ResponseEntity.ok(Map.of(
                "user", userService.toResponse(user),
                "hasDiamondThisWeek", hasDiamondThisWeek
        ));
    }

    /** POST /api/auth/logout */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        sessionUser.clear(session);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
