package com.nerlogix.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nerlogix.entity.Alert;
import com.nerlogix.model.enums.AlertSeverity;
import com.nerlogix.model.enums.AlertStatus;
import com.nerlogix.model.enums.AlertType;
import com.nerlogix.repository.AlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final SseService sseService;
    private final ObjectMapper objectMapper;

    public AlertService(AlertRepository alertRepository, SseService sseService, ObjectMapper objectMapper) {
        this.alertRepository = alertRepository;
        this.sseService = sseService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Alert createOrUpdateAlert(
            AlertType type,
            AlertSeverity severity,
            String entityType,
            Long entityId,
            String openKey,
            Map<String, String> titles,
            Map<String, String> messages) {

        if (openKey != null) {
            Alert existing = alertRepository.findByOpenKey(openKey).orElse(null);
            if (existing != null) {
                return existing; // Already open/acknowledged
            }
        }

        try {
            String titleJson = objectMapper.writeValueAsString(titles);
            String messageJson = objectMapper.writeValueAsString(messages);

            Alert alert = new Alert();
            alert.setType(type);
            alert.setSeverity(severity);
            alert.setEntityType(entityType);
            alert.setEntityId(entityId);
            alert.setOpenKey(openKey);
            alert.setStatus(AlertStatus.OPEN);
            alert.setTitle(titleJson);
            alert.setMessage(messageJson);
            alert.setCreatedAt(LocalDateTime.now());

            Alert saved = alertRepository.save(alert);
            sseService.broadcast("alert.created", Map.of("alertId", saved.getId(), "type", type.name()));
            return saved;
        } catch (Exception e) {
            log.error("Failed to create alert for openKey {}", openKey, e);
            return null;
        }
    }

    @Transactional
    public void resolveAlertByOpenKey(String openKey) {
        if (openKey == null) return;
        alertRepository.findByOpenKey(openKey).ifPresent(alert -> {
            alert.setStatus(AlertStatus.RESOLVED);
            alert.setOpenKey(null); // Clear unique openKey so standard unique index allows new alerts later
            alert.setResolvedAt(LocalDateTime.now());
            alertRepository.save(alert);
            sseService.broadcast("alert.updated", Map.of("alertId", alert.getId(), "status", "RESOLVED"));
        });
    }
}
