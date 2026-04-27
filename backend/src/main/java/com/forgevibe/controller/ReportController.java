package com.forgevibe.controller;

import com.forgevibe.dto.request.ReportRequest;
import com.forgevibe.entity.User;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.ReportService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;
    private final SessionUser sessionUser;

    private User requireUser(HttpSession session) {
        Long id = sessionUser.getUserId(session);
        if (id == null) throw new RuntimeException("UNAUTHORIZED");
        return userService.getById(id);
    }

    /** POST /api/reports */
    @PostMapping
    public ResponseEntity<?> report(@Valid @RequestBody ReportRequest req, HttpSession session) {
        reportService.fileReport(req, requireUser(session));
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
