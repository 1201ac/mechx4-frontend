import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapLocations, RoadNodeDto } from '../api/map';
import { planRoutes, RouteOptionDto } from '../api/routes';
import { Navigation, AlertTriangle, Route as RouteIcon, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { GoogleMapEmbed } from '../components/GoogleMapEmbed';

const createNodeIcon = (kind: string) => {
  const color = kind === 'HOSPITAL' ? '#C6403A' : kind === 'DEPOT' ? '#14597A' : '#4B5563';
  return L.divIcon({
    className: 'custom-node-icon',
    html: `<div style="background:${color}; color:white; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:11px; border:1px solid white; box-shadow:0 1px 3px rgba(0,0,0,0.3); whitespace:nowrap;">📍</div>`,
    iconAnchor: [10, 10]
  });
};

export const RoutePlannerPage: React.FC = () => {
  const [originId, setOriginId] = useState<number | ''>('');
  const [destId, setDestId] = useState<number | ''>('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(1);

  const { data: nodes = [], isLoading: isLoadingNodes, isError: isErrorNodes, refetch: refetchNodes } = useQuery<RoadNodeDto[]>({
    queryKey: ['mapLocations'],
    queryFn: getMapLocations
  });

  const planMutation = useMutation({
    mutationFn: planRoutes,
    onSuccess: (data) => {
      if (data.length > 0) {
        setSelectedOptionIndex(data[0].optionIndex);
      }
    }
  });

  const handlePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof originId === 'number' && typeof destId === 'number') {
      planMutation.mutate({ originNodeId: originId, destinationNodeId: destId });
    }
  };

  const currentOption: RouteOptionDto | undefined = planMutation.data?.find(opt => opt.optionIndex === selectedOptionIndex);

  let polylineCoords: [number, number][] = [];
  if (currentOption?.geometry) {
    try {
      const parsed: [number, number][] = JSON.parse(currentOption.geometry);
      polylineCoords = parsed;
    } catch {
      polylineCoords = [];
    }
  }

  const originNode = nodes.find(n => n.id === originId);
  const destNode = nodes.find(n => n.id === destId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 font-heading">Alternate Routes & Delay Estimator</h1>
        <p className="text-ink-500 text-sm">
          Rule-based Dijkstra routing over accessible corridors with real-time risk penalties and delay predictions.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white p-5 rounded-panel border border-mist-200 shadow-sm">
        <form onSubmit={handlePlan} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-ink-600 uppercase mb-1">Origin Location</label>
            {isLoadingNodes ? (
              <div className="h-10 bg-mist-100 animate-pulse rounded-control" />
            ) : isErrorNodes ? (
              <div className="flex items-center gap-2 text-xs text-crimson-600">
                <span>Failed to load nodes</span>
                <button type="button" onClick={() => refetchNodes()} className="underline font-semibold">Retry</button>
              </div>
            ) : (
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-10 px-3 border border-mist-300 rounded-control text-sm focus:outline-none focus:border-river-500 bg-white"
                required
              >
                <option value="">Select origin node...</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} disabled={n.id === destId}>
                    {n.name} ({n.kind}) {n.districtName ? `- ${n.districtName}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 uppercase mb-1">Destination Location</label>
            {isLoadingNodes ? (
              <div className="h-10 bg-mist-100 animate-pulse rounded-control" />
            ) : isErrorNodes ? (
              <div className="flex items-center gap-2 text-xs text-crimson-600">
                <span>Failed to load nodes</span>
                <button type="button" onClick={() => refetchNodes()} className="underline font-semibold">Retry</button>
              </div>
            ) : (
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-10 px-3 border border-mist-300 rounded-control text-sm focus:outline-none focus:border-river-500 bg-white"
                required
              >
                <option value="">Select destination node...</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} disabled={n.id === originId}>
                    {n.name} ({n.kind}) {n.districtName ? `- ${n.districtName}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={planMutation.isPending || !originId || !destId}
              className="w-full h-10 bg-river-600 text-white font-medium rounded-control hover:bg-river-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {planMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Routes...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Calculate Safe Routes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Google Maps Route Location & Directions Preview */}
      {(originNode || destNode) && (
        <GoogleMapEmbed
          originLat={originNode?.lat}
          originLng={originNode?.lng}
          destLat={destNode?.lat}
          destLng={destNode?.lng}
          query={destNode ? `${destNode.name}, India` : `${originNode?.name}, India`}
          height="240px"
          title={`Google Maps Driving Route - ${originNode?.name || 'Origin'} to ${destNode?.name || 'Destination'}`}
        />
      )}

      {/* Error state */}
      {planMutation.isError && (
        <div className="p-4 bg-crimson-50 border border-crimson-200 rounded-panel text-crimson-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-crimson-600 shrink-0" />
            <span className="text-sm font-medium">
              {(planMutation.error as unknown as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to compute navigable route for the selected locations.'}
            </span>
          </div>
          <button
            onClick={() => {
              if (typeof originId === 'number' && typeof destId === 'number') {
                planMutation.mutate({ originNodeId: originId, destinationNodeId: destId });
              }
            }}
            className="px-3 py-1 bg-crimson-600 text-white rounded text-xs font-semibold hover:bg-crimson-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Section */}
      {planMutation.data && planMutation.data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Options List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink-900 font-heading flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-river-600" />
              <span>Available Route Options ({planMutation.data.length})</span>
            </h2>

            {planMutation.data.map((opt) => {
              const isSelected = opt.optionIndex === selectedOptionIndex;
              const riskColor = opt.riskCategory === 'CRITICAL' ? 'bg-crimson-100 text-crimson-700 border-crimson-300' :
                                opt.riskCategory === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                opt.riskCategory === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <div
                  key={opt.optionIndex}
                  onClick={() => setSelectedOptionIndex(opt.optionIndex)}
                  className={`p-4 rounded-panel border cursor-pointer transition-all ${
                    isSelected ? 'bg-white border-river-500 shadow-md ring-2 ring-river-500/20' : 'bg-white border-mist-200 hover:border-mist-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-ink-900">{opt.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${riskColor}`}>
                      {opt.riskCategory} RISK ({opt.riskScore})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-ink-600 mb-3 bg-mist-50 p-2 rounded">
                    <div>
                      <span className="block text-[10px] text-ink-400 uppercase font-semibold">Distance</span>
                      <span className="font-bold text-ink-900 text-sm">{opt.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 uppercase font-semibold">Est. Total Time</span>
                      <span className="font-bold text-ink-900 text-sm">{opt.etaMinutes} min</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 uppercase font-semibold">Expected Delay</span>
                      <span className={`font-bold text-sm ${opt.expectedDelayMin > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        +{opt.expectedDelayMin} min
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-600 italic bg-amber-50/50 p-2 rounded border border-amber-100/50 flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{opt.reason}</span>
                  </p>

                  <div className="mt-3 pt-2 border-t border-mist-100 text-[11px] text-ink-400 flex items-center justify-between">
                    <span>{opt.segmentIds.length} road segments</span>
                    {opt.isEmergencyOptimized && (
                      <span className="px-1.5 py-0.5 bg-crimson-100 text-crimson-800 rounded font-semibold text-[10px]">
                        EMERGENCY MODE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Map & Segment Breakdown */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-3 rounded-panel border border-mist-200 shadow-sm h-[420px] relative">
              <MapContainer
                center={[25.5, 93.0]}
                zoom={7}
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {polylineCoords.length > 0 && (
                  <Polyline
                    positions={polylineCoords}
                    pathOptions={{
                      color: currentOption?.riskCategory === 'CRITICAL' ? '#C6403A' :
                             currentOption?.riskCategory === 'HIGH' ? '#D98A00' :
                             currentOption?.riskCategory === 'MEDIUM' ? '#B45309' : '#14597A',
                      weight: 5,
                      opacity: 0.85
                    }}
                  />
                )}

                {originNode && (
                  <Marker position={[originNode.lat, originNode.lng]} icon={createNodeIcon(originNode.kind)}>
                    <Popup>
                      <div className="text-xs">
                        <strong>Origin: {originNode.name}</strong>
                        <div>Kind: {originNode.kind}</div>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {destNode && (
                  <Marker position={[destNode.lat, destNode.lng]} icon={createNodeIcon(destNode.kind)}>
                    <Popup>
                      <div className="text-xs">
                        <strong>Destination: {destNode.name}</strong>
                        <div>Kind: {destNode.kind}</div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            {/* Segment Breakdown */}
            {currentOption && (
              <div className="bg-white p-4 rounded-panel border border-mist-200">
                <h3 className="font-bold text-sm text-ink-900 mb-2 font-heading">Route Segment Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {currentOption.segmentNames.map((name, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-mist-100 text-ink-800 text-xs rounded-control font-medium">
                      <span>{name}</span>
                      {idx < currentOption.segmentNames.length - 1 && <ArrowRight className="w-3 h-3 text-ink-400 ml-1" />}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
