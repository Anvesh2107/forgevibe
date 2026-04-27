package com.forgevibe.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AppealRequest {
    @NotBlank private String message;
}
