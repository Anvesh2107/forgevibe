package com.forgevibe.service;

import com.forgevibe.dto.response.LeaderboardEntry;
import com.forgevibe.dto.response.UserResponse;
import com.forgevibe.entity.User;
import com.forgevibe.repository.LikeRepository;
import com.forgevibe.repository.ProjectDiamondRepository;
import com.forgevibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final ProjectDiamondRepository diamondRepository;

    public UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .displayName(u.getDisplayName())
                .avatarUrl(u.getAvatarUrl())
                .bio(u.getBio())
                .forgeScore(u.getForgeScore())
                .reputationPoints(u.getForgeScore())
                .diamonds(u.getDiamonds())
                .stars(u.getStars())
                .totalLikes(u.getTotalLikes())
                .publicRepoCount(u.getPublicRepoCount())
                .followerCount(u.getFollowerCount())
                .verified(u.getVerified())
                .build();
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    /** Recalculate ForgeScore: diamonds×50 + stars×3 + likes×1 + aiScore×40 (ai component from projects) */
    public void recalcScore(User user, int additionalAiScorePoints) {
        int score = (user.getDiamonds() * 50)
                  + (user.getStars() * 3)
                  + (user.getTotalLikes())
                  + additionalAiScorePoints;
        user.setForgeScore(score);
        userRepository.save(user);
    }

    public List<LeaderboardEntry> getLeaderboard(String period) {
        if ("monthly".equals(period)) {
            return getMonthlyLeaderboard();
        }
        List<User> users = userRepository.findAllByOrderByForgeScoreDesc();
        return IntStream.range(0, users.size())
                .mapToObj(i -> {
                    User u = users.get(i);
                    return LeaderboardEntry.builder()
                            .rank(i + 1)
                            .user(toResponse(u))
                            .forgeScore(u.getForgeScore())
                            .diamonds(u.getDiamonds())
                            .stars(u.getStars())
                            .totalLikes(u.getTotalLikes())
                            .build();
                })
                .toList();
    }

    private List<LeaderboardEntry> getMonthlyLeaderboard() {
        LocalDateTime monthStart = LocalDateTime.now()
                .with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();

        Map<Long, Long> diamondsByUser = new HashMap<>();
        for (Object[] row : diamondRepository.countDiamondsPerAuthorSince(monthStart)) {
            diamondsByUser.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }

        Map<Long, Long> likesByUser = new HashMap<>();
        for (Object[] row : likeRepository.countProjectLikesPerAuthorSince(monthStart)) {
            likesByUser.merge(((Number) row[0]).longValue(), ((Number) row[1]).longValue(), Long::sum);
        }
        for (Object[] row : likeRepository.countThoughtLikesPerAuthorSince(monthStart)) {
            likesByUser.merge(((Number) row[0]).longValue(), ((Number) row[1]).longValue(), Long::sum);
        }

        Set<Long> activeUserIds = new HashSet<>(diamondsByUser.keySet());
        activeUserIds.addAll(likesByUser.keySet());

        List<LeaderboardEntry> entries = activeUserIds.stream()
                .map(uid -> userRepository.findById(uid).map(u -> {
                    long d = diamondsByUser.getOrDefault(uid, 0L);
                    long l = likesByUser.getOrDefault(uid, 0L);
                    return LeaderboardEntry.builder()
                            .user(toResponse(u))
                            .forgeScore((int) (d * 50 + l))
                            .diamonds((int) d)
                            .stars(0)
                            .totalLikes((int) l)
                            .build();
                }).orElse(null))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(LeaderboardEntry::getForgeScore).reversed())
                .collect(Collectors.toList());

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }
        return entries;
    }
}
