package com.forgevibe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ThoughtRequest {
    @NotBlank
    @Size(min = 10, max = 2000)
    private String content;
}
