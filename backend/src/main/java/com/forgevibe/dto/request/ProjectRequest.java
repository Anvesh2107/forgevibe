package com.forgevibe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProjectRequest {
    @NotBlank @Size(max = 100) private String title;
    @NotBlank @Size(max = 500) private String description;
    @Size(max = 200)           private String stack;
    @Size(max = 200)           private String repoUrl;
    @Size(max = 200)           private String liveUrl;
}
