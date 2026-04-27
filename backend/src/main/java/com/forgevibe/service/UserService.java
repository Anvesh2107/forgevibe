package com.forgevibe.service;

import com.forgevibe.dto.response.LeaderboardEntry;
import com.forgevibe.dto.response.UserResponse;
import com.forgevibe.entity.User;
import com.forgevibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
}
