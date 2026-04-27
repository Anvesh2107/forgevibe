package com.forgevibe.security;

import com.forgevibe.entity.User;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;

@Component
public class SessionUser {

    private static final String SESSION_KEY = "CURRENT_USER";

    public void set(HttpSession session, User user) {
        session.setAttribute(SESSION_KEY, user.getId());
    }

    public Long getUserId(HttpSession session) {
        return (Long) session.getAttribute(SESSION_KEY);
    }

    public void setById(HttpSession session, Long userId) {
        session.setAttribute(SESSION_KEY, userId);
    }

    public void clear(HttpSession session) {
        session.removeAttribute(SESSION_KEY);
    }
}
