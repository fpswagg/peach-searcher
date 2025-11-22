import types_json from "@/data/types.json";
import { extractIdRG, extractThumbnailRG, extractURLRG, getGIFs, getRedditPosts, hasIDRG, RedditPost } from "./fetcher";
import fs from "fs";
import path from "path";

const types = types_json as Record<string, (string|number)[]>;
/*const mediaPath = path.join(process.cwd(), "data", "media.json");

function getAllMedia(): Record<string, MediaItem[]> {
  try {
    if (!fs.existsSync(mediaPath)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(mediaPath, "utf8")) as Record<string, MediaItem[]>;
  } catch (error) {
    console.error("Error loading media: ", error);
    return {};
  }
}

function getMedia(type: string): MediaItem[] {
  const media = getAllMedia()[type] || [];
  // Ensure all items have IDs - generate them if missing
  return media.map((item, index) => {
    if (!item.id) {
      return {
        ...item,
        id: generateMediaId(item.url, index),
      };
    }
    return item;
  });
}

function saveMediaItems(type: string, media: MediaItem[]) {
  const allMedia = getAllMedia();
  allMedia[type] = media;
  fs.writeFileSync(mediaPath, JSON.stringify(allMedia, null, 2));
}

function saveAllMediaItems(media: Record<string, MediaItem[]>) {
  fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2));
}

function appendMediaItems(type: string, media: MediaItem[]) {
  if (!media || media.length === 0) return;
  
  const allMedia = getAllMedia();
  const existing = allMedia[type] || [];
  // Filter out duplicates by URL before appending
  const existingUrls = new Set(existing.map(item => item.url));
  const newItems = media.filter(item => !existingUrls.has(item.url));
  
  if (newItems.length > 0) {
    allMedia[type] = [...newItems, ...existing];
    fs.writeFileSync(mediaPath, JSON.stringify(allMedia, null, 2));
  }
}

function appendAllMediaItems(media: Record<string, MediaItem[]>) {
  const allMedia = getAllMedia();
  Object.entries(media).forEach(([type, items]) => {
    allMedia[type] = [...items, ...(allMedia[type] || [])];
  });
  fs.writeFileSync(mediaPath, JSON.stringify(allMedia, null, 2));
}

function clearMediaItems(type?: string) {
  const allMedia = getAllMedia();
  if (type) delete allMedia[type];
  else Object.keys(allMedia).forEach(key => delete allMedia[key]);
  fs.writeFileSync(mediaPath, JSON.stringify(allMedia, null, 2));
}*/

// Server-side storage removed - using browser localStorage on client side instead
// See lib/media-storage.ts for client-side storage utilities

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

export const ITEMS_PER_PAGE = 24;

export function getTypes(): string[] {
    return ["All", ...Object.keys(types).filter(key => !key.startsWith("_"))];
}

// Generate a unique ID for a media item based on its URL
function generateMediaId(url: string, index?: number): string {
  try {
    // Use a hash of the URL for consistency
    const urlHash = url.split('/').pop()?.split('?')[0] || '';
    // Create a simple hash from the URL for deterministic IDs
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hashStr = Math.abs(hash).toString(36).substring(0, 10);
    const urlPart = urlHash.length > 0 ? urlHash.substring(0, 15) : hashStr;
    return `media-${urlPart}-${index !== undefined ? index : hashStr}`;
  } catch (error) {
    // Fallback to timestamp-based ID
    return `media-${Date.now()}-${index || Math.random().toString(36).substring(7)}`;
  }
}

// Convert a Reddit post to a MediaItem
async function convertPostToMediaItem(redditPost: RedditPost, acceptsRedGifs: boolean, itemCounter: number): Promise<MediaItem | null> {
  if (!redditPost.url) {
    return null;
  }

  // Check if it's a Redgif
  if (hasIDRG(redditPost.url)) {
    if (!acceptsRedGifs) {
      return null;
    }

    const redgifId = extractIdRG(redditPost.url);
    if (!redgifId) {
      return null;
    }

    const redgif = await getGIFs(redgifId);
    if (redgif.error || !redgif.gifs.length) {
      return null;
    }

    const url = extractURLRG(redgif.gifs[0].urls);
    const thumbnail = extractThumbnailRG(redgif.gifs[0].urls);
    const duration = redgif.gifs[0].duration;

    if (!url) {
      return null;
    }

    return {
      id: generateMediaId(url, itemCounter),
      type: "video",
      url,
      thumbnail,
      duration,
      name: redditPost.title,
      description: redditPost.selftext || undefined,
      created_utc: redditPost.created_utc,
    };
  }

  // Check if it's a Reddit video
  const isRedditVideo = redditPost.is_video || redditPost.url.includes('v.redd.it');

  if (isRedditVideo) {
    let videoUrl = redditPost.url;
    let thumbnail = redditPost.thumbnail;

    // Try to extract video URL from media object
    if (redditPost.media?.reddit_video?.fallback_url) {
      videoUrl = redditPost.media.reddit_video.fallback_url;
    } else if (redditPost.secure_media?.reddit_video?.fallback_url) {
      videoUrl = redditPost.secure_media.reddit_video.fallback_url;
    }

    // Get thumbnail from media if available
    if (redditPost.media?.reddit_video?.thumbnail) {
      thumbnail = redditPost.media.reddit_video.thumbnail;
    } else if (redditPost.thumbnail && redditPost.thumbnail !== 'self' && redditPost.thumbnail !== 'default' && redditPost.thumbnail !== 'nsfw') {
      thumbnail = redditPost.thumbnail.replace(/&amp;/g, '&');
    }

    return {
      id: generateMediaId(videoUrl, itemCounter),
      type: "video",
      url: videoUrl,
      thumbnail: thumbnail || undefined,
      name: redditPost.title,
      description: redditPost.selftext || undefined,
      created_utc: redditPost.created_utc,
    };
  }

  // It's an image (must be from reddit media domain)
  if (!redditPost.is_reddit_media_domain) {
    return null;
  }

  return {
    id: generateMediaId(redditPost.url, itemCounter),
    name: redditPost.title,
    description: redditPost.selftext || undefined,
    type: "image",
    url: redditPost.url,
    created_utc: redditPost.created_utc,
  };
}

// Fetch up to 100 recent posts for a type and convert them to media items
export async function generateMediaItems(type: string): Promise<MediaItem[]> {
  let typeSubreddits: string[] = [];
  
  // Handle "All" type - use _AllTypes from types.json
  if (type === "All") {
    const typeConfig = types["_AllTypes"] as (string|number)[] | undefined;
    if (typeConfig && Array.isArray(typeConfig)) {
      const allTypesList = typeConfig.filter((t): t is string => typeof t === "string");
      // Collect all subreddits from all sub-types
      for (const subType of allTypesList) {
        if (!types[subType] || !Array.isArray(types[subType])) {
          continue;
        }
        const subreddits = randomize(...types[subType]);
        typeSubreddits.push(...subreddits.filter((s): s is string => typeof s === "string"));
      }
    } else {
      console.warn(`"_AllTypes" not found in types.json or is not an array`);
      return [];
    }
  } else {
    // Skip if type doesn't exist in types object
    if (!types[type] || !Array.isArray(types[type])) {
      console.warn(`Type "${type}" not found in types.json or is not an array`);
      return [];
    }
    const subreddits = randomize(...types[type]);
    typeSubreddits = subreddits.filter((s): s is string => typeof s === "string");
  }

  // Remove duplicates from subreddits
  const uniqueSubreddits = Array.from(new Set(typeSubreddits));
  
  if (uniqueSubreddits.length === 0) {
    return [];
  }

  // Fetch posts from all subreddits
  const acceptsRedGifs = !((types["_NoRedGifs"] || []) as string[]).includes(type);
  const allPosts: MediaItem[] = [];
  const existingUrls = new Set<string>();
  let itemCounter = 0;

  // Fetch posts from each subreddit
  for (const subreddit of uniqueSubreddits) {
    try {
      const redditResponse = await getRedditPosts(subreddit);
      if (redditResponse.error || !redditResponse.data || !Array.isArray(redditResponse.data)) {
        console.error(`Error fetching posts from ${subreddit}:`, redditResponse.error);
        continue;
      }

      // Filter posts that are valid media and convert them
      const validPosts = redditResponse.data.filter(
        post => post.url && (!hasIDRG(post.url) || acceptsRedGifs) && (post.is_video || post.is_reddit_media_domain)
      );

      // Convert posts to media items
      for (const redditPost of validPosts) {
        // Skip if already exists
        if (existingUrls.has(redditPost.url)) {
          continue;
        }

        const mediaItem = await convertPostToMediaItem(redditPost, acceptsRedGifs, itemCounter++);
        if (mediaItem && !existingUrls.has(mediaItem.url)) {
          allPosts.push(mediaItem);
          existingUrls.add(mediaItem.url); // Track to avoid duplicates within this batch
        }
      }
    } catch (error) {
      console.error(`Error processing subreddit ${subreddit}:`, error);
      continue;
    }
  }

  // Sort by created_utc timestamp (newest first - highest timestamp first)
  // Reddit returns newest first, but we're mixing multiple subreddits, so we need to sort
  allPosts.sort((a, b) => {
    const aTime = a.created_utc || 0;
    const bTime = b.created_utc || 0;
    return bTime - aTime; // Higher timestamp (newer) comes first
  });
  
  // Return generated items (newest first)
  return allPosts;
}

export async function getMediaItems(type: string, limit: number = ITEMS_PER_PAGE): Promise<MediaItem[]> {
  const items = await generateMediaItems(type);
  return items.slice(0, limit);
}

export async function mediaItems(type: string, limit: number = ITEMS_PER_PAGE, offset: number = 0): Promise<MediaItem[]> {
  const items = await generateMediaItems(type);
  
  // Return the requested slice (items are already in newest-first order)
  return items.slice(offset, offset + limit);
}

// Clear cache for a specific type (useful when switching types)
// This is a no-op on server side - client should use clearCachedMedia from lib/media-storage.ts
export function clearMediaCache(type?: string) {
  // Client-side cache clearing is handled by lib/media-storage.ts
  // This function is kept for API compatibility
}

function randomize(...array: (string|number)[]) {
  return array.map(
      function (element, index) {
          if (typeof element === 'string') {
              if (array.length > (index+1) && typeof array[index+1] === 'number')
                  if (Math.floor(array[index+1] as number) === array[index+1])
                      return choose<typeof element|false>(...[...Array((array[index+1] as number)-1)].fill(false), element);
                  else
                      return [...Array(1/(array[index+1] as number))].map(()=>element);
              else 
                  return element;
          } else {
              return false;
          }
      }
  ).filter(Boolean).flat().sort(()=>Math.random()-0.5) as string[];
}

export function choose<T>(...params: T[]): T {
  const randomIndex = Math.floor(Math.random() * params.length);
  return params.sort(()=>(Math.random()-0.5))[randomIndex];
}
