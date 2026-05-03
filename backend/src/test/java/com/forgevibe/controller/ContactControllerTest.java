package com.forgevibe.controller;

import com.forgevibe.entity.Project;
import com.forgevibe.entity.User;
import com.forgevibe.repository.ProjectRepository;
import com.forgevibe.security.SessionUser;
import com.forgevibe.service.EmailService;
import com.forgevibe.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContactControllerTest {

    @Mock EmailService emailService;
    @Mock SessionUser sessionUser;
    @Mock UserService userService;
    @Mock ProjectRepository projectRepository;
    @Mock HttpSession session;

    @InjectMocks ContactController contactController;

    private User owner;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).username("alice")
                .diamonds(0).stars(0).totalLikes(0).forgeScore(0)
                .publicRepoCount(0).followerCount(0).verified(false)
                .build();

        project = Project.builder()
                .id(10L).title("Cool Project").description("desc")
                .stack("Java").repoUrl("https://github.com/alice/cool")
                .author(owner).build();
    }

    // ── POST /api/contact ─────────────────────────────────────────────────────

    @Test
    void contact_returnsOkAndSendsEmail() {
        Map<String, String> body = Map.of(
                "name", "Bob", "email", "bob@example.com",
                "subject", "Hello", "message", "Nice app!");

        ResponseEntity<Map<String, String>> res = contactController.contact(body);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsEntry("status", "sent");
        verify(emailService).sendContactMessage("Bob", "bob@example.com", "Hello", "Nice app!");
    }

    @Test
    void contact_returnsBadRequestWhenNameMissing() {
        Map<String, String> body = Map.of(
                "email", "bob@example.com", "subject", "Hello", "message", "Hi");

        ResponseEntity<Map<String, String>> res = contactController.contact(body);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(emailService);
    }

    @Test
    void contact_returnsBadRequestWhenEmailMissing() {
        Map<String, String> body = Map.of(
                "name", "Bob", "subject", "Hello", "message", "Hi");

        ResponseEntity<Map<String, String>> res = contactController.contact(body);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(emailService);
    }

    @Test
    void contact_returnsBadRequestWhenMessageEmpty() {
        Map<String, String> body = Map.of(
                "name", "Bob", "email", "bob@example.com",
                "subject", "Hello", "message", "   ");

        ResponseEntity<Map<String, String>> res = contactController.contact(body);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(emailService);
    }

    // ── POST /api/projects/{id}/review-request ────────────────────────────────

    @Test
    void reviewRequest_returnsUnauthorizedWhenNotLoggedIn() {
        when(sessionUser.getUserId(session)).thenReturn(null);

        ResponseEntity<Map<String, String>> res = contactController.reviewRequest(
                10L, Map.of("context", "Please review"), session);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(emailService);
    }

    @Test
    void reviewRequest_returnsNotFoundWhenProjectMissing() {
        when(sessionUser.getUserId(session)).thenReturn(1L);
        when(userService.getById(1L)).thenReturn(owner);
        when(projectRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseEntity<Map<String, String>> res = contactController.reviewRequest(
                99L, Map.of("context", "Please review"), session);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verifyNoInteractions(emailService);
    }

    @Test
    void reviewRequest_returnsForbiddenWhenNotOwner() {
        User other = User.builder().id(2L).username("other")
                .diamonds(0).stars(0).totalLikes(0).forgeScore(0)
                .publicRepoCount(0).followerCount(0).verified(false).build();

        when(sessionUser.getUserId(session)).thenReturn(2L);
        when(userService.getById(2L)).thenReturn(other);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        ResponseEntity<Map<String, String>> res = contactController.reviewRequest(
                10L, Map.of("context", "Please review"), session);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verifyNoInteractions(emailService);
    }

    @Test
    void reviewRequest_returnsBadRequestWhenContextBlank() {
        when(sessionUser.getUserId(session)).thenReturn(1L);
        when(userService.getById(1L)).thenReturn(owner);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        ResponseEntity<Map<String, String>> res = contactController.reviewRequest(
                10L, Map.of("context", "   "), session);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(emailService);
    }

    @Test
    void reviewRequest_returnsOkAndSendsEmailWhenOwner() {
        when(sessionUser.getUserId(session)).thenReturn(1L);
        when(userService.getById(1L)).thenReturn(owner);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        ResponseEntity<Map<String, String>> res = contactController.reviewRequest(
                10L, Map.of("context", "AI missed my architecture"), session);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsEntry("status", "sent");
        verify(emailService).sendReviewRequest("Cool Project", "10", "alice", "AI missed my architecture");
    }
}
