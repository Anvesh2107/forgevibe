package com.forgevibe.config;

import com.forgevibe.entity.Space;
import com.forgevibe.entity.SpaceMember;
import com.forgevibe.entity.User;
import com.forgevibe.repository.SpaceMemberRepository;
import com.forgevibe.repository.SpaceRepository;
import com.forgevibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;
    private final SpaceMemberRepository spaceMemberRepository;

    record SpaceSeed(String name, String slug, String description, String emoji) {}

    private static final List<SpaceSeed> DEFAULT_SPACES = List.of(
        new SpaceSeed("React Developers",  "react-developers",  "Building UIs with React, Next.js, and the modern frontend ecosystem.", "⚛️"),
        new SpaceSeed("Java & Spring",     "java-spring",       "All things Java, Spring Boot, microservices, and backend architecture.", "☕"),
        new SpaceSeed("AI / ML",           "ai-ml",             "Machine learning, LLMs, prompt engineering, and AI-powered products.", "🤖"),
        new SpaceSeed("DevOps & Cloud",    "devops-cloud",      "Docker, Kubernetes, CI/CD, AWS, GCP, Azure — ship reliably at scale.", "☁️"),
        new SpaceSeed("Open Source",       "open-source",       "Discuss open source projects, contributions, and sustainability.", "🌐"),
        new SpaceSeed("Security Research", "security-research", "Cybersecurity, pen-testing, CTFs, and responsible disclosure.", "🔐"),
        new SpaceSeed("Side Projects",     "side-projects",     "Show off your side projects and get feedback from fellow builders.", "🛠️"),
        new SpaceSeed("TypeScript",        "typescript",        "TypeScript tips, patterns, and tooling across the full stack.", "💎")
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (spaceRepository.count() > 0) return;

        User system = userRepository.findByUsername("forgevibe")
            .orElseGet(() -> userRepository.save(
                User.builder()
                    .username("forgevibe")
                    .displayName("ForgeVibe")
                    .avatarUrl("https://avatars.githubusercontent.com/u/9919")
                    .verified(true)
                    .build()
            ));

        for (SpaceSeed seed : DEFAULT_SPACES) {
            Space space = spaceRepository.save(
                Space.builder()
                    .name(seed.name())
                    .slug(seed.slug())
                    .description(seed.description())
                    .emoji(seed.emoji())
                    .owner(system)
                    .memberCount(1)
                    .postCount(0)
                    .build()
            );
            spaceMemberRepository.save(
                SpaceMember.builder()
                    .space(space)
                    .user(system)
                    .role("owner")
                    .build()
            );
        }
    }
}
