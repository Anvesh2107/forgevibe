package com.forgevibe.controller;

import com.forgevibe.entity.Report;
import com.forgevibe.service.ReportService;
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

    /** GET /api/admin/reports */
    @GetMapping("/reports")
    public ResponseEntity<List<Report>> pendingReports() {
        return ResponseEntity.ok(reportService.getPendingReports());
    }

    /** POST /api/admin/reports/:id/resolve   body: { "status": "approved"|"rejected" } */
    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolve(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        reportService.resolveReport(id, body.get("status"));
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
