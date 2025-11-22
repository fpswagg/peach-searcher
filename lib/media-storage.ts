"use client";

import { MediaItem } from "@/types/media";

const STORAGE_KEY_PREFIX = "peach-searcher-media-";
const STORAGE_TIMESTAMP_PREFIX = "peach-searcher-timestamp-";

// Get cached media for a specific type
export function getCachedMedia(type: string): MediaItem[] | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data as MediaItem[];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
}

// Save media to cache
export function saveCachedMedia(type: string, media: MediaItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(media));
    localStorage.setItem(`${STORAGE_TIMESTAMP_PREFIX}${type}`, Date.now().toString());
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    // Handle quota exceeded error
    if (error instanceof Error && error.name === "QuotaExceededError") {
      // Clear old cache if storage is full
      clearOldCache();
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(media));
        localStorage.setItem(`${STORAGE_TIMESTAMP_PREFIX}${type}`, Date.now().toString());
      } catch (retryError) {
        console.error("Failed to save after clearing cache:", retryError);
      }
    }
  }
}

// Append media to existing cache
export function appendCachedMedia(type: string, newMedia: MediaItem[]): void {
  if (typeof window === "undefined") return;
  
  try {
    const existing = getCachedMedia(type) || [];
    const existingUrls = new Set(existing.map(item => item.url));
    const uniqueNewMedia = newMedia.filter(item => !existingUrls.has(item.url));
    
    if (uniqueNewMedia.length > 0) {
      // Prepend new items (newest first)
      const updated = [...uniqueNewMedia, ...existing];
      saveCachedMedia(type, updated);
    }
  } catch (error) {
    console.error("Error appending to cache:", error);
  }
}

// Clear cache for a specific type or all types
export function clearCachedMedia(type?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    if (type) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${type}`);
      localStorage.removeItem(`${STORAGE_TIMESTAMP_PREFIX}${type}`);
    } else {
      // Clear all media cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEY_PREFIX) || key.startsWith(STORAGE_TIMESTAMP_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

// Clear old cache entries (older than 24 hours)
function clearOldCache(): void {
  if (typeof window === "undefined") return;
  
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    keys.forEach(key => {
      if (key.startsWith(STORAGE_TIMESTAMP_PREFIX)) {
        const timestamp = parseInt(localStorage.getItem(key) || "0", 10);
        if (now - timestamp > maxAge) {
          const type = key.replace(STORAGE_TIMESTAMP_PREFIX, "");
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}${type}`);
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error("Error clearing old cache:", error);
  }
}

