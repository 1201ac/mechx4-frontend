package com.nerlogix.service;

import com.nerlogix.dto.UserDto;
import com.nerlogix.entity.*;
import com.nerlogix.exception.ResourceNotFoundException;
import com.nerlogix.model.enums.Role;
import com.nerlogix.repository.*;
import com.nerlogix.service.risk.RiskEngine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final RuleConfigService ruleConfigService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedService seedService;
    private final RiskEngine riskEngine;

    public AdminService(
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            RuleConfigRepository ruleConfigRepository,
            RuleConfigService ruleConfigService,
            RefreshTokenRepository refreshTokenRepository,
            ApiKeyRepository apiKeyRepository,
            PasswordEncoder passwordEncoder,
            SeedService seedService,
            RiskEngine riskEngine) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.ruleConfigRepository = ruleConfigRepository;
        this.ruleConfigService = ruleConfigService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedService = seedService;
        this.riskEngine = riskEngine;
    }

    public Page<UserDto> getUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        List<UserDto> dtos = page.getContent().stream().map(UserDto::fromEntity).toList();
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional
    public UserDto updateUserRole(Long userId, Role role, User currentUser) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (currentUser != null && u.getId().equals(currentUser.getId()) && role != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot demote your own admin account");
        }

        if (u.getRole() == Role.ADMIN && role != Role.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndActive(Role.ADMIN, true);
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot demote the last active admin user");
            }
        }

        u.setRole(role);
        u = userRepository.save(u);
        refreshTokenRepository.deleteByUser(u);
        return UserDto.fromEntity(u);
    }

    @Transactional
    public UserDto updateUserActive(Long userId, boolean active, User currentUser) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (currentUser != null && u.getId().equals(currentUser.getId()) && !active) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot deactivate your own admin account");
        }

        if (u.getRole() == Role.ADMIN && !active) {
            long activeAdminCount = userRepository.countByRoleAndActive(Role.ADMIN, true);
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot deactivate the last active admin user");
            }
        }

        u.setActive(active);
        u = userRepository.save(u);
        refreshTokenRepository.deleteByUser(u);
        return UserDto.fromEntity(u);
    }

    @Transactional
    public void resetUserPassword(Long userId, String newPassword) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        u.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(u);
        refreshTokenRepository.deleteByUser(u);
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public List<RuleConfig> getRuleConfigs() {
        return ruleConfigService.getAllRules();
    }

    @Transactional
    public RuleConfig updateRuleConfig(String key, String value) {
        ruleConfigService.updateRules(Map.of(key, value));
        riskEngine.recomputeAll();
        return ruleConfigRepository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found: " + key));
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
