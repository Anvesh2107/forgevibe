package com.forgevibe.controller;

import com.forgevibe.dto.request.AppealRequest;
import com.forgevibe.dto.request.CommentRequest;
import com.forgevibe.dto.request.ReactionRequest;
import com.forgevibe.dto.request.ThoughtRequest;
import com.forgevibe.dto.response.CommentResponse;
import com.forgevibe.dto.response.ThoughtResponse;
import com.forgevibe.entity.User;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.CommentService;
import com.forgevibe.service.ThoughtService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/thoughts")
@RequiredArgsConstructor
public class ThoughtController {

    private final ThoughtService thoughtService;
    private final CommentService commentService;
    private final UserService userService;
    private final SessionUser sessionUser;

    private User requireUser(HttpSession session) {
        Long id = sessionUser.getUserId(session);
        if (id == null) throw new RuntimeException("UNAUTHORIZED");
        return userService.getById(id);
    }

    /** POST /api/thoughts */
    @PostMapping
    public ResponseEntity<?> submit(@Valid @RequestBody ThoughtRequest req, HttpSession session) {
        try {
            return ResponseEntity.ok(thoughtService.submit(req, requireUser(session)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/thoughts */
    @GetMapping
    public ResponseEntity<List<ThoughtResponse>> list(HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(thoughtService.getPublished(viewer));
    }

    /** GET /api/thoughts/:id */
    @GetMapping("/{id}")
    public ResponseEntity<ThoughtResponse> get(@PathVariable Long id, HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(thoughtService.getById(id, viewer));
    }

    /** POST /api/thoughts/:id/react */
    @PostMapping("/{id}/react")
    public ResponseEntity<ThoughtResponse> react(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        return ResponseEntity.ok(thoughtService.react(id, body.get("reactionType"), requireUser(session)));
    }

    /** POST /api/thoughts/:id/appeal */
    @PostMapping("/{id}/appeal")
    public ResponseEntity<?> appeal(
            @PathVariable Long id,
            @Valid @RequestBody AppealRequest req,
            HttpSession session) {
        thoughtService.appeal(id, req.getMessage(), requireUser(session));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** GET /api/thoughts/:id/comments */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getComments("thought", id));
    }

    /** POST /api/thoughts/:id/comments */
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest req,
            HttpSession session) {
        return ResponseEntity.ok(commentService.addComment("thought", id, req, requireUser(session)));
    }
}
