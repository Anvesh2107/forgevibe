package com.forgevibe.controller;

import com.forgevibe.dto.request.CommentRequest;
import com.forgevibe.dto.request.ProjectRequest;
import com.forgevibe.dto.response.CommentResponse;
import com.forgevibe.dto.response.ProjectResponse;
import com.forgevibe.entity.User;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.CommentService;
import com.forgevibe.service.ProjectService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final CommentService commentService;
    private final UserService userService;
    private final SessionUser sessionUser;

    private User requireUser(HttpSession session) {
        Long id = sessionUser.getUserId(session);
        if (id == null) throw new RuntimeException("UNAUTHORIZED");
        return userService.getById(id);
    }

    /** GET /api/projects */
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> list(HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(projectService.getAll(viewer));
    }

    /** GET /api/projects/:id */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> get(@PathVariable Long id, HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(projectService.getById(id, viewer));
    }

    /** POST /api/projects */
    @PostMapping
    public ResponseEntity<ProjectResponse> submit(@Valid @RequestBody ProjectRequest req, HttpSession session) {
        return ResponseEntity.ok(projectService.submit(req, requireUser(session)));
    }

    /** POST /api/projects/:id/react */
    @PostMapping("/{id}/react")
    public ResponseEntity<ProjectResponse> react(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        return ResponseEntity.ok(projectService.react(id, body.get("reactionType"), requireUser(session)));
    }

    /** POST /api/projects/:id/like */
    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> like(@PathVariable Long id, HttpSession session) {
        ProjectResponse project = projectService.toggleLike(id, requireUser(session));
        return ResponseEntity.ok(Map.of("project", project));
    }

    /** POST /api/projects/:id/star */
    @PostMapping("/{id}/star")
    public ResponseEntity<ProjectResponse> star(@PathVariable Long id, HttpSession session) {
        return ResponseEntity.ok(projectService.starProject(id, requireUser(session)));
    }

    /** POST /api/projects/:id/diamond */
    @PostMapping("/{id}/diamond")
    public ResponseEntity<ProjectResponse> diamond(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(projectService.diamondProject(id, requireUser(session), note));
    }

    /** POST /api/projects/:id/reanalyze */
    @PostMapping("/{id}/reanalyze")
    public ResponseEntity<ProjectResponse> reanalyze(@PathVariable Long id, HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(projectService.retriggerAnalysis(id, viewer));
    }

    /** GET /api/projects/:id/comments */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getComments("project", id));
    }

    /** POST /api/projects/:id/comments */
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest req,
            HttpSession session) {
        return ResponseEntity.ok(commentService.addComment("project", id, req, requireUser(session)));
    }
}
