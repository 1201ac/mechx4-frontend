package com.nerlogix.dto;

import com.nerlogix.model.enums.NodeKind;

public record RoadNodeDto(
    Long id,
    String name,
    double lat,
    double lng,
    Long districtId,
    String districtName,
    NodeKind kind
) {}
