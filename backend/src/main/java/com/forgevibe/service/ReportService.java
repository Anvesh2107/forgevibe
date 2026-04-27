package com.forgevibe.service;

import com.forgevibe.dto.request.ReportRequest;
import com.forgevibe.entity.Report;
import com.forgevibe.entity.User;
import com.forgevibe.event.ReportFiledEvent;
import com.forgevibe.kafka.KafkaProducerService;
import com.forgevibe.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepo;
    private final KafkaProducerService kafka;

    public Report fileReport(ReportRequest req, User reporter) {
        Report report = Report.builder()
                .contentType(req.getContentType())
                .contentId(req.getContentId())
                .reporter(reporter)
                .reason(req.getReason())
                .status("pending")
                .build();
        report = reportRepo.save(report);

        kafka.sendReportFiled(ReportFiledEvent.builder()
                .reportId(report.getId())
                .reporterId(reporter.getId())
                .contentType(req.getContentType())
                .contentId(req.getContentId())
                .reason(req.getReason())
                .build());

        return report;
    }

    public List<Report> getPendingReports() {
        return reportRepo.findByStatusOrderByCreatedAtDesc("pending");
    }

    public Report resolveReport(Long reportId, String status) {
        Report report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus(status); // "approved" | "rejected"
        return reportRepo.save(report);
    }
}
