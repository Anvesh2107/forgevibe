package com.forgevibe.kafka;

import com.forgevibe.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendThoughtSubmitted(ThoughtSubmittedEvent event) {
        log.info("Sending thought.submitted for thoughtId={}", event.getThoughtId());
        kafkaTemplate.send(KafkaTopics.THOUGHT_SUBMITTED, String.valueOf(event.getThoughtId()), event);
    }

    public void sendProjectSubmitted(ProjectSubmittedEvent event) {
        log.info("Sending project.submitted for projectId={}", event.getProjectId());
        kafkaTemplate.send(KafkaTopics.PROJECT_SUBMITTED, String.valueOf(event.getProjectId()), event);
    }

    public void sendReportFiled(ReportFiledEvent event) {
        log.info("Sending report.filed for reportId={}", event.getReportId());
        kafkaTemplate.send(KafkaTopics.REPORT_FILED, String.valueOf(event.getReportId()), event);
    }
}
