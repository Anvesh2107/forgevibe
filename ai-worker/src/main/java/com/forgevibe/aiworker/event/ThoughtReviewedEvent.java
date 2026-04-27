package com.forgevibe.aiworker.event;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThoughtReviewedEvent {
    private Long thoughtId;
    private String status;       // "published", "needs_context", "blocked"
    private Integer confidence;  // 0-100
    private String reason;
}
