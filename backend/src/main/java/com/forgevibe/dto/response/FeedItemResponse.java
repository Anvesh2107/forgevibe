package com.forgevibe.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FeedItemResponse {
    private String type;            // "thought" | "project"
    private ThoughtResponse thought;
    private ProjectResponse project;
}
