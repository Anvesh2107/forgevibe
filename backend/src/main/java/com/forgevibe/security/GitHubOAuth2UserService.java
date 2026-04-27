package com.forgevibe.security;

import com.forgevibe.entity.User;
import com.forgevibe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attrs = oAuth2User.getAttributes();

        String githubId = String.valueOf(attrs.get("id"));
        String login = (String) attrs.get("login");
        String avatarUrl = (String) attrs.get("avatar_url");
        String bio = (String) attrs.get("bio");
        int publicRepos = attrs.get("public_repos") instanceof Number n ? n.intValue() : 0;
        int followers = attrs.get("followers") instanceof Number n ? n.intValue() : 0;

        User user = userRepository.findByGithubId(githubId).orElse(null);
        if (user == null) {
            user = User.builder()
                    .githubId(githubId)
                    .username(login)
                    .displayName(login)
                    .avatarUrl(avatarUrl)
                    .bio(bio)
                    .publicRepoCount(publicRepos)
                    .followerCount(followers)
                    .build();
        } else {
            user.setUsername(login);
            user.setAvatarUrl(avatarUrl);
            user.setBio(bio);
            user.setPublicRepoCount(publicRepos);
            user.setFollowerCount(followers);
        }
        user = userRepository.save(user);

        Map<String, Object> enriched = new HashMap<>(attrs);
        enriched.put("dbId", user.getId());

        return new DefaultOAuth2User(Collections.emptyList(), enriched, "login");
    }
}
