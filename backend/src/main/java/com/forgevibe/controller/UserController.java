package com.forgevibe.controller;

import com.forgevibe.dto.response.ProjectResponse;
import com.forgevibe.dto.response.SpaceResponse;
import com.forgevibe.dto.response.ThoughtResponse;
import com.forgevibe.dto.response.UserResponse;
import com.forgevibe.entity.User;
import com.forgevibe.repository.CommentRepository;
import com.forgevibe.repository.ProjectDiamondRepository;
import com.forgevibe.repository.ProjectRepository;
import com.forgevibe.repository.ThoughtPostRepository;
import com.forgevibe.repository.UserRepository;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.ProjectService;
import com.forgevibe.service.SpaceService;
import com.forgevibe.service.ThoughtService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ProjectService projectService;
    private final ThoughtService thoughtService;
    private final SpaceService spaceService;
    private final SessionUser sessionUser;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ThoughtPostRepository thoughtPostRepository;
    private final ProjectDiamondRepository projectDiamondRepository;
    private final CommentRepository commentRepository;

    /** GET /api/users/:identifier — accepts numeric id OR username */
    @GetMapping("/api/users/{identifier}")
    public ResponseEntity<?> getUser(@PathVariable String identifier) {
        try {
            User user;
            try {
                user = userService.getById(Long.parseLong(identifier));
            } catch (NumberFormatException e) {
                user = userService.getByUsername(identifier);
            }
            return ResponseEntity.ok(userService.toResponse(user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(java.util.Map.of("error", "User not found"));
        }
    }

    /** GET /api/users/:username/projects */
    @GetMapping("/api/users/{username}/projects")
    public ResponseEntity<List<ProjectResponse>> getUserProjects(
            @PathVariable String username, HttpSession session) {
        User profileUser = userService.getByUsername(username);
        Long viewerId = sessionUser.getUserId(session);
        User viewer = viewerId != null ? userService.getById(viewerId) : null;
        return ResponseEntity.ok(projectService.getByAuthorId(profileUser.getId(), viewer));
    }

    /** GET /api/users/:username/spaces */
    @GetMapping("/api/users/{username}/spaces")
    public ResponseEntity<List<SpaceResponse>> getUserSpaces(
            @PathVariable String username, HttpSession session) {
        User profileUser = userService.getByUsername(username);
        Long viewerId = sessionUser.getUserId(session);
        User viewer = viewerId != null ? userService.getById(viewerId) : null;
        return ResponseEntity.ok(spaceService.getByOwnerId(profileUser.getId(), viewer));
    }

    /** GET /api/users/:username/thoughts */
    @GetMapping("/api/users/{username}/thoughts")
    public ResponseEntity<List<ThoughtResponse>> getUserThoughts(
            @PathVariable String username, HttpSession session) {
        User profileUser = userService.getByUsername(username);
        Long viewerId = sessionUser.getUserId(session);
        User viewer = viewerId != null ? userService.getById(viewerId) : null;
        return ResponseEntity.ok(thoughtService.getByAuthorId(profileUser.getId(), viewer));
    }

    /** GET /api/users/:username/diamonds-given */
    @GetMapping("/api/users/{username}/diamonds-given")
    public ResponseEntity<List<Object>> getUserDiamondsGiven(@PathVariable String username) {
        return ResponseEntity.ok(List.of());
    }

    /** GET /api/leaderboard?period=weekly|monthly|alltime */
    @GetMapping("/api/leaderboard")
    public ResponseEntity<List<ProjectResponse>> leaderboard(
            @RequestParam(defaultValue = "alltime") String period) {
        return ResponseEntity.ok(projectService.getLeaderboard(period));
    }

    /** GET /api/diamond-givers */
    @GetMapping("/api/diamond-givers")
    public ResponseEntity<List<Object>> diamondGivers() {
        return ResponseEntity.ok(List.of());
    }

    /** GET /api/stats — platform traction numbers */
    @GetMapping("/api/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
            "users",     userRepository.count(),
            "projects",  projectRepository.count(),
            "thoughts",  thoughtPostRepository.count(),
            "diamonds",  projectDiamondRepository.count(),
            "comments",  commentRepository.count()
        ));
    }
}
