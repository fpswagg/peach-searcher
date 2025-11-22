"use client";

import { useState, useEffect } from "react";
import { MediaItem } from "@/types/media";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, AlertCircle, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";

interface MediaDialogProps {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaDialog({ item, open, onOpenChange }: MediaDialogProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);

  // Reset error and loading states when item changes
  useEffect(() => {
    if (item) {
      setImageError(false);
      setVideoError(false);
      setImageLoading(true);
      setVideoLoading(true);
    }
  }, [item]);

  if (!item) return null;

  const handleDownload = async () => {
    try {
      // Try to fetch the file as a blob first
      const response = await fetch(item.url, {
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Get file extension from URL or default based on type
      const urlExtension = item.url.split('.').pop()?.split('?')[0] || '';
      const extension = urlExtension || (item.type === 'video' ? 'mp4' : 'jpg');
      
      // Sanitize file name
      const sanitizedName = item.name
        .replace(/[^a-z0-9]/gi, '_')
        .substring(0, 100); // Limit length
      const fileName = `${sanitizedName}.${extension}`;
      
      // Create download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
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
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-base-200 p-4 sm:p-6 min-h-0 relative" style={{ minHeight: '250px', maxHeight: '60vh' }}>
          {item.type === "video" ? (
            <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center" style={{ minHeight: '250px' }}>
              {!videoError ? (
                <>
                  {videoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-300 rounded-lg">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                  )}
                  <video
                    src={item.url}
                    controls
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg relative z-10"
                    autoPlay
                    onError={() => {
                      setVideoError(true);
                      setVideoLoading(false);
                    }}
                    onLoadedData={() => setVideoLoading(false)}
                    onCanPlay={() => setVideoLoading(false)}
                    style={{ maxHeight: '60vh' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center p-8 bg-base-300 rounded-lg">
                  <AlertCircle className="h-12 w-12 text-base-content/30 mb-4" />
                  <p className="text-sm text-base-content/70">Failed to load video</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center" style={{ minHeight: '250px' }}>
              {!imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-300 rounded-lg z-20">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                  )}
                  <div className="relative w-full h-full flex items-center justify-center bg-base-300 rounded-lg" style={{ maxHeight: '60vh', minHeight: '250px' }}>
                    <Image
                      src={item.url}
                      alt={item.name}
                      width={1200}
                      height={800}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg relative z-10"
                      sizes="(max-width: 768px) 98vw, (max-width: 1200px) 90vw, 80vw"
                      unoptimized
                      onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                      }}
                      onLoad={() => setImageLoading(false)}
                      priority
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center p-8 bg-base-300 rounded-lg">
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


