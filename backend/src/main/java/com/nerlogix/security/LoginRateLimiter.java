package com.nerlogix.security;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long TIME_WINDOW_MS = 60000; // 1 minute

    private final Map<String, AttemptInfo> attemptsMap = new ConcurrentHashMap<>();

    public boolean isAllowed(String ip) {
        long now = System.currentTimeMillis();
        AttemptInfo info = attemptsMap.compute(ip, (key, val) -> {
            if (val == null || (now - val.firstAttemptTime > TIME_WINDOW_MS)) {
                return new AttemptInfo(1, now);
            }
            val.count++;
            return val;
        });

        return info.count <= MAX_ATTEMPTS;
    }

    private static class AttemptInfo {
        int count;
        long firstAttemptTime;

        AttemptInfo(int count, long firstAttemptTime) {
            this.count = count;
            this.firstAttemptTime = firstAttemptTime;
        }
    }
}
