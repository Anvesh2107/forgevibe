package com.forgevibe.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock JavaMailSender mailSender;
    @InjectMocks EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "contactEmail", "hello@forgevibeapp.com");
    }

    // ── sendContactMessage ────────────────────────────────────────────────────

    @Test
    void sendContactMessage_skipsWhenPasswordBlank() {
        ReflectionTestUtils.setField(emailService, "smtpPassword", "");

        emailService.sendContactMessage("Alice", "alice@example.com", "Hello", "Hi there");

        verifyNoInteractions(mailSender);
    }

    @Test
    void sendContactMessage_sendsEmailWithCorrectFields() {
        ReflectionTestUtils.setField(emailService, "smtpPassword", "secret");

        emailService.sendContactMessage("Alice", "alice@example.com", "Hello", "Hi there");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("hello@forgevibeapp.com");
        assertThat(sent.getFrom()).isEqualTo("hello@forgevibeapp.com");
        assertThat(sent.getReplyTo()).isEqualTo("alice@example.com");
        assertThat(sent.getSubject()).isEqualTo("[ForgeVibe Contact] Hello");
        assertThat(sent.getText()).contains("Alice").contains("alice@example.com").contains("Hi there");
    }

    @Test
    void sendContactMessage_doesNotPropagateException() {
        ReflectionTestUtils.setField(emailService, "smtpPassword", "secret");
        doThrow(new RuntimeException("SMTP failure")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatNoException().isThrownBy(() ->
                emailService.sendContactMessage("Alice", "alice@example.com", "Hello", "Hi"));
    }

    // ── sendReviewRequest ─────────────────────────────────────────────────────

    @Test
    void sendReviewRequest_skipsWhenPasswordBlank() {
        ReflectionTestUtils.setField(emailService, "smtpPassword", "");

        emailService.sendReviewRequest("MyProject", "42", "bob", "Please review");

        verifyNoInteractions(mailSender);
    }

    @Test
    void sendReviewRequest_sendsEmailWithCorrectFields() {
        ReflectionTestUtils.setField(emailService, "smtpPassword", "secret");

        emailService.sendReviewRequest("MyProject", "42", "bob", "Please review");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("hello@forgevibeapp.com");
        assertThat(sent.getSubject()).isEqualTo("[ForgeVibe Review Request] MyProject");
        assertThat(sent.getText())
                .contains("MyProject")
                .contains("bob")
                .contains("/projects/42")
                .contains("Please review");
    }

    @Test
    void sendReviewRequest_doesNotPropagateException() {
        ReflectionTestUtils.setField(emailService, "smtpPassword", "secret");
        doThrow(new RuntimeException("SMTP failure")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatNoException().isThrownBy(() ->
                emailService.sendReviewRequest("MyProject", "42", "bob", "Please review"));
    }
}
