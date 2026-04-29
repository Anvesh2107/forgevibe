package com.forgevibe.controller;

import com.forgevibe.entity.Report;
import com.forgevibe.entity.User;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.ReportService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ReportService reportService;
    private final SessionUser sessionUser;
    private final UserService userService;

    private User requireAdmin(HttpSession session) {
        Long id = sessionUser.getUserId(session);
        if (id == null) throw new RuntimeException("UNAUTHORIZED");
        User user = userService.getById(id);
        if (!"ADMIN".equals(user.getRole())) throw new RuntimeException("UNAUTHORIZED");
        return user;
    }

    /** GET /api/admin/reports */
    @GetMapping("/reports")
    public ResponseEntity<List<Report>> pendingReports(HttpSession session) {
        requireAdmin(session);
        return ResponseEntity.ok(reportService.getPendingReports());
    }

    /** POST /api/admin/reports/:id/resolve   body: { "status": "approved"|"rejected" } */
    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolve(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        requireAdmin(session);
        reportService.resolveReport(id, body.get("status"));
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
