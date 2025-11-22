export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  description?: string;
  url: string;
  thumbnail?: string;
  duration?: number; // Duration in seconds for videos
  created_utc?: number; // Timestamp for sorting (newest first)
}

