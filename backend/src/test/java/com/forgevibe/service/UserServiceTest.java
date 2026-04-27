package com.forgevibe.service;

import com.forgevibe.entity.User;
import com.forgevibe.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserService userService;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = User.builder()
                .id(1L)
                .username("alice")
                .displayName("Alice Smith")
                .diamonds(2)
                .stars(3)
                .totalLikes(10)
                .forgeScore(0)
                .publicRepoCount(5)
                .followerCount(100)
                .verified(false)
                .build();
    }

    @Test
    void getById_whenUserExists_returnsUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));

        User result = userService.getById(1L);

        assertThat(result.getUsername()).isEqualTo("alice");
        verify(userRepository).findById(1L);
    }

    @Test
    void getById_whenUserNotFound_throwsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getByUsername_whenUserExists_returnsUser() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));

        User result = userService.getByUsername("alice");

        assertThat(result.getId()).isEqualTo(1L);
        verify(userRepository).findByUsername("alice");
    }

    @Test
    void getByUsername_whenUserNotFound_throwsException() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getByUsername("ghost"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void recalcScore_appliesCorrectFormula() {
        // diamonds×50 + stars×3 + totalLikes×1 + aiPoints
        // 2×50 + 3×3 + 10×1 + 20 = 100 + 9 + 10 + 20 = 139
        userService.recalcScore(alice, 20);

        assertThat(alice.getForgeScore()).isEqualTo(139);
        verify(userRepository).save(alice);
    }
}
