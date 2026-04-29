package com.forgevibe.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String username;

    @Column(length = 80)
    private String displayName;

    @Column(length = 500)
    private String bio;

    private String avatarUrl;

    @Column(nullable = false)
    @Builder.Default
    private Integer forgeScore = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer diamonds = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer stars = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalLikes = 0;

    @Column(unique = true, length = 40)
    private String githubId;

    @Column(length = 20)
    @Builder.Default
    private String role = "USER";

    @Column(nullable = false)
    @Builder.Default
    private Integer publicRepoCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer followerCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
