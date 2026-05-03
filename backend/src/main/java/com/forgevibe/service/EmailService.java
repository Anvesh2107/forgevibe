package com.forgevibe.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.contact-email:hello@forgevibeapp.com}")
    private String contactEmail;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    public void sendContactMessage(String fromName, String fromEmail, String subject, String message) {
        if (smtpPassword.isBlank()) {
            log.warn("ZOHO_SMTP_PASSWORD not set — skipping contact email from {}", fromEmail);
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(contactEmail);
            mail.setFrom(contactEmail);
            mail.setReplyTo(fromEmail);
            mail.setSubject("[ForgeVibe Contact] " + subject);
            mail.setText("From: " + fromName + " <" + fromEmail + ">\n\n" + message);
            mailSender.send(mail);
        } catch (Exception e) {
            log.error("Failed to send contact email: {}", e.getMessage());
        }
    }

    public void sendAppealNotification(String username, Long thoughtId, String content, String note) {
        if (smtpPassword.isBlank()) {
            log.warn("ZOHO_SMTP_PASSWORD not set — skipping appeal email for thought {}", thoughtId);
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(contactEmail);
            mail.setFrom(contactEmail);
            mail.setSubject("[ForgeVibe Appeal] @" + username + " — thought #" + thoughtId);
            mail.setText(
                "User: @" + username + "\n" +
                "Thought ID: " + thoughtId + "\n\n" +
                "Post content:\n" + content + "\n\n" +
                "User's note:\n" + (note != null && !note.isBlank() ? note : "(none provided)")
            );
            mailSender.send(mail);
        } catch (Exception e) {
            log.error("Failed to send appeal email: {}", e.getMessage());
        }
    }

    public void sendReviewRequest(String projectName, String projectId, String ownerUsername, String context) {
        if (smtpPassword.isBlank()) {
            log.warn("ZOHO_SMTP_PASSWORD not set — skipping review request for project {}", projectId);
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(contactEmail);
            mail.setFrom(contactEmail);
            mail.setSubject("[ForgeVibe Review Request] " + projectName);
            mail.setText(
                "Project: " + projectName + "\n" +
                "Owner: " + ownerUsername + "\n" +
                "URL: https://forgevibeapp.com/projects/" + projectId + "\n\n" +
                "Message from owner:\n" + context
            );
            mailSender.send(mail);
        } catch (Exception e) {
            log.error("Failed to send review request email: {}", e.getMessage());
        }
    }
}
