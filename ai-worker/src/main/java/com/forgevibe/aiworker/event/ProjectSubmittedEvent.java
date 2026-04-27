package com.forgevibe.aiworker.event;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectSubmittedEvent {
    private Long projectId;
    private Long userId;
    private String title;
    private String description;
    private String stack;
}
