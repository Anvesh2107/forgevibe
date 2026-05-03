package com.forgevibe.controller;

import com.forgevibe.entity.Project;
import com.forgevibe.entity.User;
import com.forgevibe.repository.ProjectRepository;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.EmailService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ContactController {

    private final EmailService emailService;
    private final SessionUser sessionUser;
    private final UserService userService;
    private final ProjectRepository projectRepository;

    /** POST /api/contact — public */
    @PostMapping("/api/contact")
    public ResponseEntity<Map<String, String>> contact(@RequestBody Map<String, String> body) {
        String name    = body.getOrDefault("name", "").strip();
        String email   = body.getOrDefault("email", "").strip();
        String subject = body.getOrDefault("subject", "").strip();
        String message = body.getOrDefault("message", "").strip();

        if (name.isEmpty() || email.isEmpty() || subject.isEmpty() || message.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required"));
        }

        emailService.sendContactMessage(name, email, subject, message);
        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    /** POST /api/projects/{id}/review-request — owner only */
    @PostMapping("/api/projects/{id}/review-request")
    public ResponseEntity<Map<String, String>> reviewRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {

        Long userId = sessionUser.getUserId(session);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        User user = userService.getById(userId);
        Project project = projectRepository.findById(id)
                .orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        if (!project.getAuthor().getId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String context = body.getOrDefault("context", "").strip();
        if (context.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Context is required"));
        }

        emailService.sendReviewRequest(project.getTitle(), String.valueOf(id), user.getUsername(), context);
        return ResponseEntity.ok(Map.of("status", "sent"));
    }
}
