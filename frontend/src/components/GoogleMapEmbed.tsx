import React from 'react';
import { MapPin } from 'lucide-react';

interface GoogleMapEmbedProps {
  lat?: number | null;
  lng?: number | null;
  query?: string;
  zoom?: number;
  height?: string;
  title?: string;
  className?: string;
}

export const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({
  lat,
  lng,
  query,
  zoom = 13,
  height = '280px',
  title = 'Google Maps Location View',
  className = '',
}) => {
  let embedUrl = '';

  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  } else if (query && query.trim().length > 0) {
    embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
  }

  if (!embedUrl) {
    return (
      <div
        style={{ height }}
        className={`w-full bg-mist-100 rounded-xl border border-mist-200 flex flex-col items-center justify-center text-ink-500 p-4 text-center ${className}`}
      >
        <MapPin className="w-8 h-8 text-ink-400 mb-2" />
        <p className="text-sm font-medium">Location coordinates not available</p>
        <p className="text-xs text-ink-400 mt-1">Select a record with valid geographic coordinates to preview Google Maps embed.</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-mist-200 bg-white shadow-sm relative ${className}`}>
      <div className="bg-mist-50 px-3 py-1.5 border-b border-mist-200 flex items-center justify-between text-xs text-ink-600 font-medium">
        <span className="flex items-center gap-1.5 font-sans">
          <MapPin className="w-3.5 h-3.5 text-river-600" />
          {title}
        </span>
        <span className="text-[10px] bg-river-600/10 text-river-700 px-1.5 py-0.5 rounded font-mono font-semibold">
          Google Maps Embed
        </span>
      </div>
      <iframe
        title={title}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={embedUrl}
        className="w-full"
      />
    </div>
  );
};
