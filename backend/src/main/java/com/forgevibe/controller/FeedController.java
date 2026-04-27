package com.forgevibe.controller;

import com.forgevibe.dto.response.FeedItemResponse;
import com.forgevibe.entity.User;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.FeedService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;
    private final UserService userService;
    private final SessionUser sessionUser;

    /**
     * GET /api/feed?filter=all|thoughts|projects
     */
    @GetMapping
    public ResponseEntity<List<FeedItemResponse>> getFeed(
            @RequestParam(defaultValue = "all") String filter,
            HttpSession session) {
        Long userId = sessionUser.getUserId(session);
        User viewer = userId != null ? userService.getById(userId) : null;
        return ResponseEntity.ok(feedService.getFeed(filter, viewer));
    }
}
