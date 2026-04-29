package com.forgevibe.controller;

import com.forgevibe.dto.request.CommentRequest;
import com.forgevibe.dto.request.SpaceRequest;
import com.forgevibe.dto.response.CommentResponse;
import com.forgevibe.dto.response.SpacePostResponse;
import com.forgevibe.dto.response.SpaceResponse;
import com.forgevibe.entity.User;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.CommentService;
import com.forgevibe.service.SpaceService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;
    private final CommentService commentService;
    private final UserService userService;
    private final SessionUser sessionUser;

    private User requireUser(HttpSession session) {
        Long id = sessionUser.getUserId(session);
        if (id == null) throw new RuntimeException("UNAUTHORIZED");
        return userService.getById(id);
    }

    /** GET /api/spaces */
    @GetMapping
    public ResponseEntity<List<SpaceResponse>> list(HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(spaceService.getAll(viewer));
    }

    /** POST /api/spaces */
    @PostMapping
    public ResponseEntity<SpaceResponse> create(@RequestBody SpaceRequest req, HttpSession session) {
        return ResponseEntity.ok(spaceService.createSpace(req, requireUser(session)));
    }

    /** GET /api/spaces/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<SpaceResponse> get(@PathVariable Long id, HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(spaceService.getById(id, viewer));
    }

    /** POST /api/spaces/{id}/join */
    @PostMapping("/{id}/join")
    public ResponseEntity<SpaceResponse> join(@PathVariable Long id, HttpSession session) {
        return ResponseEntity.ok(spaceService.joinSpace(id, requireUser(session)));
    }

    /** POST /api/spaces/{id}/leave */
    @PostMapping("/{id}/leave")
    public ResponseEntity<SpaceResponse> leave(@PathVariable Long id, HttpSession session) {
        return ResponseEntity.ok(spaceService.leaveSpace(id, requireUser(session)));
    }

    /** GET /api/spaces/{id}/posts */
    @GetMapping("/{id}/posts")
    public ResponseEntity<List<SpacePostResponse>> getPosts(@PathVariable Long id, HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(spaceService.getPosts(id, viewer));
    }

    /** POST /api/spaces/{id}/posts */
    @PostMapping("/{id}/posts")
    public ResponseEntity<SpacePostResponse> createPost(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        return ResponseEntity.ok(spaceService.createPost(id, body.get("content"), requireUser(session)));
    }

    /** POST /api/spaces/posts/{postId}/like */
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<SpacePostResponse> toggleLike(@PathVariable Long postId, HttpSession session) {
        return ResponseEntity.ok(spaceService.toggleLike(postId, requireUser(session)));
    }

    /** GET /api/spaces/posts/{postId}/comments */
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getComments("spacepost", postId));
    }

    /** POST /api/spaces/posts/{postId}/comments */
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long postId,
            @RequestBody CommentRequest req,
            HttpSession session) {
        return ResponseEntity.ok(commentService.addComment("spacepost", postId, req, requireUser(session)));
    }
}
