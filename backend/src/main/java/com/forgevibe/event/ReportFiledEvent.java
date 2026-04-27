package com.forgevibe.event;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportFiledEvent {
    private Long reportId;
    private Long reporterId;
    private String contentType;  // "thought", "project", "appeal"
    private Long contentId;
    private String reason;
}
