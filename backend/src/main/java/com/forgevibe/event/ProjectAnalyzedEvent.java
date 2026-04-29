package com.forgevibe.event;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectAnalyzedEvent {
    private Long projectId;
    private Integer aiScore;
    private String feedback;
    private Integer architectureScore;
    private Integer securityScore;
    private Integer qualityScore;
    private Integer docsScore;
    private String summary;
    private String vibeCheck;
    private String strengths;    // JSON array string
    private String improvements; // JSON array string
    private List<String> detectedTags;
}
