package com.forgevibe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReportRequest {
    @NotBlank private String contentType; // "thought" | "project"
    @NotNull  private Long contentId;
    @NotBlank private String reason;
}
