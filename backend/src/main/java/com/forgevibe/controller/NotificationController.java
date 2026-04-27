package com.forgevibe.controller;

import com.forgevibe.entity.Notification;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.NotificationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SessionUser sessionUser;

    /** GET /api/notifications */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        if (userId == null) return ResponseEntity.ok(List.of());
        List<Notification> notifications = notificationService.getForUser(userId);
        List<Map<String, Object>> response = notifications.stream()
                .map(n -> Map.<String, Object>of(
                        "id", n.getId(),
                        "type", n.getType(),
                        "payload", n.getPayload() != null ? n.getPayload() : "{}",
                        "read", n.getRead(),
                        "createdAt", n.getCreatedAt() != null ? n.getCreatedAt().toString() : LocalDateTime.now().toString()
                ))
                .toList();
        return ResponseEntity.ok(response);
    }

    /** POST /api/notifications/read-all */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        if (userId != null) notificationService.markAllRead(userId);
        return ResponseEntity.ok().build();
    }
}
