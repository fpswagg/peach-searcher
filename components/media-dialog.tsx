"use client";

import { useState, useEffect, useRef } from "react";
import { MediaItem } from "@/types/media";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, AlertCircle, Image as ImageIcon, Video, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface MediaDialogProps {
  item: MediaItem | null;
  items: MediaItem[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemChange: (item: MediaItem, index: number) => void;
}

export function MediaDialog({ item, items, currentIndex, open, onOpenChange, onItemChange }: MediaDialogProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Reset error and loading states when item changes
  useEffect(() => {
    if (item) {
      setImageError(false);
      setVideoError(false);
      setImageLoading(true);
      setVideoLoading(true);
      
      // For videos, check if we need to use proxy (for Redgifs or CORS issues)
      if (item.type === "video") {
        const isRedgifUrl = item.url.includes('redgifs.com') || item.url.includes('thumbs.redgifs.com') || item.url.includes('cdn.redgifs.com');
        // Try direct URL first, will fallback to proxy if needed
        setVideoUrl(item.url);
      } else {
        setVideoUrl(null);
      }
    }
  }, [item]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, items]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      onItemChange(nextItem, currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevItem = items[currentIndex - 1];
      onItemChange(prevItem, currentIndex - 1);
    }
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const canGoNext = currentIndex < items.length - 1;
  const canGoPrevious = currentIndex > 0;

  if (!item) return null;

  const handleDownload = async () => {
    try {
      // Try using proxy endpoint first to avoid CORS issues
      let response: Response;
      try {
        response = await fetch(`/api/proxy?url=${encodeURIComponent(item.url)}`, {
          method: 'GET',
        });
      } catch (proxyError) {
        // If proxy fails, try direct fetch
        try {
          response = await fetch(item.url, {
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Referer': item.url,
            },
          });
        } catch (fetchError) {
          // If both fail, open in new tab
          window.open(item.url, "_blank");
          return;
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Get file extension from URL or default based on type
      const urlPath = item.url.split('?')[0]; // Remove query params
      const urlExtension = urlPath.split('.').pop()?.toLowerCase() || '';
      let extension = urlExtension;
      
      // Validate extension or set default
      if (!extension || (extension.length > 4)) {
        extension = item.type === 'video' ? 'mp4' : 'jpg';
      }
      
      // Sanitize file name
      const sanitizedName = item.name
        .replace(/[^a-z0-9\s-]/gi, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100); // Limit length
      const fileName = `${sanitizedName}.${extension}`;
      
      // Create download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab (works for CORS issues)
      window.open(item.url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[98vw] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header Section */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-base-300 flex-shrink-0 bg-base-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold line-clamp-2 mb-2 text-base-content">
                {item.name}
              </DialogTitle>
              {item.description && (
                <DialogDescription className="text-sm sm:text-base text-base-content/70 line-clamp-2">
                  {item.description}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.type === "video" ? (
                <div className="badge badge-accent badge-lg gap-1.5">
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </div>
              ) : (
                <div className="badge badge-accent badge-lg gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>Image</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Media Preview Section */}
        <div 
          className="flex-1 overflow-hidden flex items-center justify-center bg-base-200 p-4 sm:p-6 min-h-0 relative" 
          style={{ minHeight: '300px', maxHeight: '70vh' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows */}
          {canGoPrevious && (
            <button
              onClick={handlePrevious}
              className="absolute left-2 sm:left-4 z-30 btn btn-circle btn-sm sm:btn-md bg-base-100/80 hover:bg-base-100 border border-base-300 shadow-lg"
              aria-label="Previous item"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
          {canGoNext && (
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-30 btn btn-circle btn-sm sm:btn-md bg-base-100/80 hover:bg-base-100 border border-base-300 shadow-lg"
              aria-label="Next item"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
          
          {/* Item Counter */}
          {items.length > 1 && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30 bg-base-100/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs sm:text-sm border border-base-300 shadow-lg">
              {currentIndex + 1} / {items.length}
            </div>
          )}
          {item.type === "video" ? (
            <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
              {!videoError ? (
                <>
                  {videoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-300 rounded-lg z-20">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                  )}
                  {videoUrl && (
                    <video
                      key={videoUrl} // Force re-render when URL changes
                      src={videoUrl}
                      controls
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg relative z-10"
                      autoPlay
                      playsInline
                      preload="metadata"
                      onError={(e) => {
                        console.error('[Video] Error loading video:', videoUrl, e);
                        // Try using proxy if direct load fails
                        if (videoUrl === item.url && !videoUrl.includes('/api/proxy')) {
                          console.log('[Video] Attempting to load via proxy...');
                          setVideoUrl(`/api/proxy?url=${encodeURIComponent(item.url)}`);
                        } else {
                          setVideoError(true);
                          setVideoLoading(false);
                        }
                      }}
                      onLoadedData={() => {
                        console.log('[Video] Video data loaded:', videoUrl);
                        setVideoLoading(false);
                      }}
                      onCanPlay={() => {
                        console.log('[Video] Video can play:', videoUrl);
                        setVideoLoading(false);
                      }}
                      onLoadStart={() => {
                        console.log('[Video] Video load started:', videoUrl);
                      }}
                      onStalled={() => {
                        console.warn('[Video] Video stalled:', videoUrl);
                      }}
                      style={{ maxHeight: '70vh', maxWidth: '100%' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-base-300 rounded-lg">
                  <AlertCircle className="h-12 w-12 text-base-content/30 mb-4" />
                  <p className="text-sm text-base-content/70">Failed to load video</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center" style={{ minHeight: '300px' }}>
              {!imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-300 rounded-lg z-20">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                  )}
                  <div className="relative w-full h-full flex items-center justify-center bg-base-300 rounded-lg" style={{ maxHeight: '70vh', minHeight: '300px', maxWidth: '100%' }}>
                    {/* Use img tag for images and GIFs - GIFs will auto-animate */}
                    <img
                      src={item.url}
                      alt={item.name}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg relative z-10"
                      style={{ maxHeight: '70vh', maxWidth: '100%' }}
                      onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                      }}
                      onLoad={() => setImageLoading(false)}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-base-300 rounded-lg">
                  <AlertCircle className="h-12 w-12 text-base-content/30 mb-4" />
                  <p className="text-sm text-base-content/70">Failed to load image</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-6 py-4 pb-6 border-t border-base-300 flex justify-end gap-3 flex-shrink-0 bg-base-100">
          <button
            onClick={handleDownload}
            className="btn btn-primary gap-2 mb-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


