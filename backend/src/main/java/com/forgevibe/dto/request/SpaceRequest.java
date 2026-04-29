package com.forgevibe.dto.request;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class SpaceRequest {
    private String name;
    private String description;
    private String emoji;
}
