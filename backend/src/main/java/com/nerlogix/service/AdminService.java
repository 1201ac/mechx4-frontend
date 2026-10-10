package com.nerlogix.service;

import com.nerlogix.dto.UserDto;
import com.nerlogix.entity.*;
import com.nerlogix.exception.ResourceNotFoundException;
import com.nerlogix.model.enums.Role;
import com.nerlogix.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final RuleConfigRepository ruleConfigRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedService seedService;

    public AdminService(
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            RuleConfigRepository ruleConfigRepository,
            ApiKeyRepository apiKeyRepository,
            PasswordEncoder passwordEncoder,
            SeedService seedService) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.ruleConfigRepository = ruleConfigRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedService = seedService;
    }

    public Page<UserDto> getUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        List<UserDto> dtos = page.getContent().stream().map(UserDto::fromEntity).toList();
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional
    public UserDto updateUserRole(Long userId, Role role) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        u.setRole(role);
        u = userRepository.save(u);
        return UserDto.fromEntity(u);
    }

    @Transactional
    public UserDto updateUserActive(Long userId, boolean active) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        u.setActive(active);
        u = userRepository.save(u);
        return UserDto.fromEntity(u);
    }

    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        u.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(u);
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public List<RuleConfig> getRuleConfigs() {
        return ruleConfigRepository.findAll();
    }

    @Transactional
    public RuleConfig updateRuleConfig(String key, String value) {
        RuleConfig cfg = ruleConfigRepository.findByConfigKey(key)
                .orElseGet(() -> new RuleConfig(key, value, "Custom rule configuration"));
        cfg.setConfigValue(value);
        return ruleConfigRepository.save(cfg);
    }

    public List<Map<String, Object>> getApiKeys() {
        return apiKeyRepository.findAll().stream().map(k -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", k.getId());
            map.put("name", k.getName());
            map.put("active", k.getActive());
            map.put("createdAt", k.getCreatedAt());
            map.put("lastUsedAt", k.getLastUsedAt());
            return map;
        }).toList();
    }

    @Transactional
    public Map<String, String> createApiKey(String name, User currentUser) {
        String rawKey = "nk_" + UUID.randomUUID().toString().replace("-", "");
        String hash = hashKey(rawKey);

        ApiKey apiKey = new ApiKey();
        apiKey.setName(name);
        apiKey.setKeyHash(hash);
        apiKey.setActive(true);
        apiKey.setCreatedBy(currentUser);
        apiKey.setCreatedAt(LocalDateTime.now());

        apiKeyRepository.save(apiKey);

        Map<String, String> res = new HashMap<>();
        res.put("name", name);
        res.put("apiKey", rawKey);
        return res;
    }

    @Transactional
    public void deleteApiKey(Long id) {
        apiKeyRepository.deleteById(id);
    }

    @Transactional
    public void resetDemoData() {
        try {
            seedService.run();
        } catch (Exception e) {
            throw new RuntimeException("Failed to reset demo data", e);
        }
    }

    private String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
