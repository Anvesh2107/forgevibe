package com.forgevibe.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class SpaceRequest {
    @NotBlank
    @Size(min = 2, max = 80)
    private String name;

    @Size(max = 300)
    private String description;

    private String emoji;

    @JsonProperty("isPaid")
    private boolean isPaid = false;

    private Double priceMonthly;
}
