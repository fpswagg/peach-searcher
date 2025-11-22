"use client";

import { useState, useEffect } from "react";
import { MediaItem } from "@/types/media";
import { Play, AlertCircle } from "lucide-react";
import Image from "next/image";

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
  showBadge?: boolean;
}

export function MediaCard({ item, onClick, showBadge = true }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset error and loading states when item changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setImageLoading(true);
  }, [item.id, item.url, item.thumbnail]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageLoading(false);
  };

  // Format duration in seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine width based on item ID for consistent variety
  // Extract number from ID and use modulo to determine width
  const idNumber = item.id ? parseInt(item.id.replace(/\D/g, '')) || 0 : Math.random() * 1000;
  const spanTwo = idNumber % 4 === 0; // Every 4th item is wider

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg bg-base-200 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01] h-64 ${
        spanTwo 
          ? 'w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.5rem)] lg:w-[calc(40%-0.8rem)] xl:w-[calc(33.333%-0.667rem)] 2xl:w-[calc(33.333%-0.667rem)]' 
          : 'w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(20%-0.8rem)] 2xl:w-[calc(16.666%-0.833rem)]'
      }`}
      style={{
        flexGrow: 0,
        flexShrink: 0,
      }}
      onClick={onClick}
    >
      <div className="relative w-full h-full overflow-hidden bg-base-300">
        {item.type === "video" ? (
          <>
            {item.thumbnail && !imageError ? (
              <div className="relative w-full h-full bg-base-300">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-base-300 z-10">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                  </div>
                )}
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  fill
                  className={`object-contain transition-all duration-300 group-hover:scale-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  loading="lazy"
                  unoptimized
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  onLoad={handleImageLoad}
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-base-300">
                {imageError ? (
                  <AlertCircle className="h-12 w-12 text-base-content/30" />
                ) : (
                  <Play className="h-12 w-12 text-base-content/50" />
                )}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-base-100/0 transition-colors duration-300 group-hover:bg-base-100/20 pointer-events-none">
              <div className="rounded-full bg-accent/80 backdrop-blur-sm p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 border border-accent/30">
                <Play className="h-8 w-8 text-accent-content fill-accent-content" />
              </div>
            </div>
          </>
        ) : (
          <>
            {!imageError ? (
              <div className="relative w-full h-full bg-base-300">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-base-300 z-10">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                  </div>
                )}
                {/* Use thumbnail if available for faster loading, otherwise use full image */}
                <Image
                  src={item.thumbnail || item.url}
                  alt={item.name}
                  fill
                  className={`object-contain transition-all duration-300 group-hover:scale-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  loading="lazy"
                  unoptimized
                  onError={() => {
                    // If thumbnail fails, try the full image URL
                    if (item.thumbnail && item.thumbnail !== item.url) {
                      setImageError(false);
                      // Will retry with full URL on next render
                    } else {
                      setImageError(true);
                      setImageLoading(false);
                    }
                  }}
                  onLoad={handleImageLoad}
                />
                {/* Load full image in background for better quality on hover */}
                {item.thumbnail && item.thumbnail !== item.url && (
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    className="hidden"
                    onLoad={() => {
                      // Full image preloaded, can swap on hover if needed
                    }}
                    unoptimized
                  />
                )}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-base-300">
                <AlertCircle className="h-12 w-12 text-base-content/30" />
              </div>
            )}
          </>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-100/95 via-base-100/70 to-transparent p-4 pt-8">
        <h3 className="text-sm font-semibold text-base-content line-clamp-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1 text-xs text-base-content/80 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
      {/* Video Duration Badge */}
      {item.type === "video" && item.duration && (
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="flex items-center gap-1 bg-accent/80 backdrop-blur-sm rounded-full px-2 py-1 border border-accent/20">
            <span className="text-xs font-semibold text-accent-content">
              {formatDuration(item.duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}


