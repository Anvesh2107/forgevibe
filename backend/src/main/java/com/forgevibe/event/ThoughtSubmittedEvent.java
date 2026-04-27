package com.forgevibe.event;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThoughtSubmittedEvent {
    private Long thoughtId;
    private Long userId;
    private String content;
}
