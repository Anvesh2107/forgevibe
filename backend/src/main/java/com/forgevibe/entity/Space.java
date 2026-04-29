package com.forgevibe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "spaces")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Space {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(unique = true, length = 100)
    private String slug;

    @Column(length = 500)
    private String description;

    @Column(length = 10)
    @Builder.Default
    private String emoji = "🚀";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Builder.Default
    private Integer memberCount = 1;

    @Builder.Default
    private Integer postCount = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
