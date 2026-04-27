package com.forgevibe.service;

import com.forgevibe.dto.request.ProjectRequest;
import com.forgevibe.dto.response.ProjectResponse;
import com.forgevibe.entity.Like;
import com.forgevibe.entity.Project;
import com.forgevibe.entity.ProjectDiamond;
import com.forgevibe.entity.User;
import com.forgevibe.event.ProjectSubmittedEvent;
import com.forgevibe.kafka.KafkaProducerService;
import com.forgevibe.repository.CommentRepository;
import com.forgevibe.repository.LikeRepository;
import com.forgevibe.repository.ProjectDiamondRepository;
import com.forgevibe.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepo;
    private final LikeRepository likeRepo;
    private final CommentRepository commentRepo;
    private final ProjectDiamondRepository diamondRepo;
    private final KafkaProducerService kafka;
    private final UserService userService;
    private final NotificationService notificationService;

    public ProjectResponse submit(ProjectRequest req, User author) {
        Project project = Project.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .stack(req.getStack())
                .repoUrl(req.getRepoUrl())
                .liveUrl(req.getLiveUrl())
                .author(author)
                .aiScore(0)
                .stars(0)
                .diamonds(0)
                .build();
        projectRepo.save(project);

        kafka.sendProjectSubmitted(ProjectSubmittedEvent.builder()
                .projectId(project.getId())
                .userId(author.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .stack(project.getStack())
                .build());

        return toResponse(project, author);
    }

    public List<ProjectResponse> getAll(User viewer) {
        return projectRepo.findAllByOrderByCreatedAtDesc()
                .stream().map(p -> toResponse(p, viewer)).toList();
    }

    public ProjectResponse getById(Long id, User viewer) {
        Project p = projectRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found: " + id));
        return toResponse(p, viewer);
    }

    public List<ProjectResponse> getByAuthorId(Long authorId, User viewer) {
        return projectRepo.findByAuthorIdOrderByCreatedAtDesc(authorId)
                .stream().map(p -> toResponse(p, viewer)).toList();
    }

    public ProjectResponse react(Long projectId, String reactionType, User user) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Optional<Like> existing = likeRepo.findByContentTypeAndContentIdAndUser("project", projectId, user);
        if (existing.isPresent()) {
            Like like = existing.get();
            if (like.getReactionType().equals(reactionType)) {
                likeRepo.delete(like);
            } else {
                like.setReactionType(reactionType);
                likeRepo.save(like);
            }
        } else {
            likeRepo.save(Like.builder()
                    .contentType("project")
                    .contentId(projectId)
                    .user(user)
                    .reactionType(reactionType)
                    .build());
            User author = project.getAuthor();
            author.setTotalLikes(author.getTotalLikes() + 1);
            userService.recalcScore(author, 0);
        }
        return toResponse(project, user);
    }

    public ProjectResponse starProject(Long projectId, User user) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setStars(project.getStars() + 1);
        projectRepo.save(project);

        User author = project.getAuthor();
        author.setStars(author.getStars() + 1);
        userService.recalcScore(author, 0);
        return toResponse(project, user);
    }

    public ProjectResponse toggleLike(Long projectId, User user) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        Optional<Like> existing = likeRepo.findByContentTypeAndContentIdAndUser("project", projectId, user);
        if (existing.isPresent()) {
            likeRepo.delete(existing.get());
            User author = project.getAuthor();
            author.setTotalLikes(Math.max(0, author.getTotalLikes() - 1));
            userService.recalcScore(author, 0);
        } else {
            likeRepo.save(Like.builder()
                    .contentType("project")
                    .contentId(projectId)
                    .user(user)
                    .reactionType("like")
                    .build());
            User author = project.getAuthor();
            author.setTotalLikes(author.getTotalLikes() + 1);
            userService.recalcScore(author, 0);
            if (!author.getId().equals(user.getId())) {
                notificationService.create(author, "liked", Map.of(
                        "fromUser", user.getUsername(),
                        "projectId", projectId,
                        "projectName", project.getTitle()
                ));
            }
        }
        return toResponse(project, user);
    }

    public ProjectResponse diamondProject(Long projectId, User user, String note) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (project.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Cannot diamond your own project");
        }

        Optional<ProjectDiamond> existing = diamondRepo.findByProjectIdAndUser(projectId, user);
        User author = project.getAuthor();

        if (existing.isPresent()) {
            // Toggle off — remove the diamond
            diamondRepo.delete(existing.get());
            project.setDiamonds(Math.max(0, project.getDiamonds() - 1));
            projectRepo.save(project);
            author.setDiamonds(Math.max(0, author.getDiamonds() - 1));
            userService.recalcScore(author, 0);
        } else {
            // Give the diamond
            diamondRepo.save(ProjectDiamond.builder()
                    .project(project)
                    .user(user)
                    .note(note != null && !note.isBlank() ? note.substring(0, Math.min(50, note.length())) : null)
                    .build());
            project.setDiamonds(project.getDiamonds() + 1);
            projectRepo.save(project);
            author.setDiamonds(author.getDiamonds() + 1);
            userService.recalcScore(author, project.getAiScore() != null ? project.getAiScore() * 40 / 100 : 0);
            if (!author.getId().equals(user.getId())) {
                notificationService.create(author, "diamond", Map.of(
                        "fromUser", user.getUsername(),
                        "projectId", projectId,
                        "projectName", project.getTitle()
                ));
            }
        }
        return toResponse(project, user);
    }

    public ProjectResponse toResponse(Project project, User viewer) {
        Map<String, Long> reactions = likeRepo.findByContentTypeAndContentId("project", project.getId())
                .stream()
                .collect(Collectors.groupingBy(Like::getReactionType, Collectors.counting()));

        String userReaction = viewer != null
                ? likeRepo.findByContentTypeAndContentIdAndUser("project", project.getId(), viewer)
                        .map(Like::getReactionType).orElse(null)
                : null;

        long commentCount = commentRepo.countByContentTypeAndContentId("project", project.getId());
        long likeCount = reactions.values().stream().mapToLong(Long::longValue).sum();
        boolean hasLiked = "like".equals(userReaction);

        // Convert stack CSV → JSON array string for frontend
        String tagsJson = "[]";
        if (project.getStack() != null && !project.getStack().isBlank()) {
            tagsJson = "[" + Arrays.stream(project.getStack().split(",\\s*"))
                    .map(t -> "\"" + t.trim().replace("\"", "") + "\"")
                    .collect(Collectors.joining(",")) + "]";
        }

        // forgevibeScore = diamonds×50 + stars×3 + likes + aiScore×40/100
        double forgevibeScore = (project.getDiamonds() * 50L)
                + (project.getStars() * 3L)
                + likeCount
                + (project.getAiScore() != null ? project.getAiScore() * 40.0 / 100.0 : 0);

        // Build analysis sub-object only when fully analyzed
        ProjectResponse.AnalysisDto analysisDto = null;
        if ("analyzed".equals(project.getAnalysisStatus()) && project.getArchitectureScore() != null) {
            analysisDto = ProjectResponse.AnalysisDto.builder()
                    .architectureScore(project.getArchitectureScore())
                    .securityScore(project.getSecurityScore())
                    .qualityScore(project.getQualityScore())
                    .docsScore(project.getDocsScore())
                    .summary(project.getAnalysisSummary())
                    .vibeCheck(project.getAnalysisVibeCheck())
                    .strengths(project.getAnalysisStrengths())
                    .improvements(project.getAnalysisImprovements())
                    .build();
        }

        boolean hasDiamond = viewer != null
                && diamondRepo.findByProjectIdAndUser(project.getId(), viewer).isPresent();

        List<ProjectDiamond> givers = diamondRepo.findByProjectIdOrderByCreatedAtDesc(project.getId());
        List<ProjectResponse.DiamondGiverDto> diamondGivers = givers.stream()
                .map(d -> ProjectResponse.DiamondGiverDto.builder()
                        .id(d.getId())
                        .username(d.getUser().getUsername())
                        .avatarUrl(d.getUser().getAvatarUrl())
                        .note(d.getNote())
                        .createdAt(d.getCreatedAt())
                        .build())
                .toList();

        var authorResponse = userService.toResponse(project.getAuthor());

        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .stack(project.getStack())
                .repoUrl(project.getRepoUrl())
                .liveUrl(project.getLiveUrl())
                .aiScore(project.getAiScore())
                .stars(project.getStars())
                .diamonds(project.getDiamonds())
                .author(authorResponse)
                .reactions(reactions)
                .userReaction(userReaction)
                .commentCount(commentCount)
                .createdAt(project.getCreatedAt())
                // frontend-compatible aliases
                .name(project.getTitle())
                .githubUrl(project.getRepoUrl())
                .user(authorResponse)
                .tags(tagsJson)
                .likeCount(likeCount)
                .hasLiked(hasLiked)
                .hasDiamond(hasDiamond)
                .diamondCount(project.getDiamonds())
                .githubStars(project.getStars())
                .forgevibeScore(forgevibeScore)
                .coverImageUrl(null)
                .analysisStatus(project.getAnalysisStatus() != null ? project.getAnalysisStatus() : "pending")
                .analysis(analysisDto)
                .diamondGivers(diamondGivers)
                .build();
    }
}
