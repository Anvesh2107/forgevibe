package com.forgevibe.service;

import com.forgevibe.dto.response.FeedItemResponse;
import com.forgevibe.dto.response.ThoughtResponse;
import com.forgevibe.dto.response.ProjectResponse;
import com.forgevibe.entity.User;
import com.forgevibe.repository.ThoughtPostRepository;
import com.forgevibe.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final ThoughtPostRepository thoughtRepo;
    private final ProjectRepository projectRepo;
    private final ThoughtService thoughtService;
    private final ProjectService projectService;

    /**
     * Returns a unified feed sorted by createdAt desc.
     * filter: "all" | "thoughts" | "projects"
     */
    public List<FeedItemResponse> getFeed(String filter, String tag, User viewer) {
        List<FeedItemResponse> items = new ArrayList<>();
        boolean tagged = tag != null && !tag.isBlank();

        if (!"projects".equals(filter)) {
            thoughtRepo.findByStatusOrderByCreatedAtDesc("published")
                    .forEach(t -> items.add(FeedItemResponse.builder()
                            .type("thought")
                            .thought(thoughtService.toResponse(t, viewer))
                            .build()));
        }

        if (!"thoughts".equals(filter)) {
            (tagged
                    ? projectRepo.findByStackContainingIgnoreCaseOrderByCreatedAtDesc(tag)
                    : projectRepo.findAllByOrderByCreatedAtDesc())
                    .forEach(p -> items.add(FeedItemResponse.builder()
                            .type("project")
                            .project(projectService.toResponse(p, viewer))
                            .build()));
        }

        // Sort merged list by createdAt desc
        items.sort(Comparator.comparing(i -> {
            if (i.getThought() != null) return i.getThought().getCreatedAt();
            if (i.getProject() != null) return i.getProject().getCreatedAt();
            return java.time.LocalDateTime.MIN;
        }, Comparator.reverseOrder()));

        return items;
    }
}
