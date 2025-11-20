import types_json from "@/data/types.json";
import { extractIdRG, extractThumbnailRG, extractURLRG, getGIFs, getRedditPosts, hasIDRG, RedditPost } from "./fetcher";
import fs from "fs";
import path from "path";

const types = types_json as Record<string, (string|number)[]>;
const mediaPath = path.join(process.cwd(), "data", "media.json");

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
  const allMedia = getAllMedia();
  allMedia[type] = [...media, ...(allMedia[type] || [])];
  fs.writeFileSync(mediaPath, JSON.stringify(allMedia, null, 2));
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
}

export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  description?: string;
  url: string;
  thumbnail?: string;
  duration?: number; // Duration in seconds for videos
}

export const ITEMS_PER_PAGE = 24;

export function getTypes(): string[] {
    return ["All", ...Object.keys(types).filter(key => !key.startsWith("_"))];
}

// Generate a unique ID for a media item based on its URL
function generateMediaId(url: string, index?: number): string {
  // Use a hash of the URL for consistency, or fallback to timestamp + index
  const urlHash = url.split('/').pop()?.split('?')[0] || '';
  const hash = urlHash.length > 0 ? urlHash.substring(0, 20) : Date.now().toString();
  return `media-${hash}-${index || Math.random().toString(36).substring(7)}`;
}

async function generateMediaItems(type?: string): Promise<MediaItem[]> {
  const allTypes = type ? [type] : getTypes();
  const allMedia = getAllMedia();
  let newMedia: MediaItem[] = [];
  let itemCounter = 0;

  const subredditBank = {} as Record<string, MediaItem[]>;

  async function getPosts(subreddit: string, acceptsRedGifs: boolean, count?: number): Promise<MediaItem[]> {
    if (subredditBank[subreddit] && subredditBank[subreddit].length >= (count||0))
      if (count) return subredditBank[subreddit].slice(0, count);
      else return subredditBank[subreddit];
    
    const redditResponse = await getRedditPosts(subreddit, count);
    if (redditResponse.error || !redditResponse.data || !Array.isArray(redditResponse.data)) {
      console.error(`Error fetching posts from ${subreddit}:`, redditResponse.error);
      return [];
    }
    
    const posts = (await Promise.all(redditResponse.data.filter(
      post => post.url && (!hasIDRG(post.url) || acceptsRedGifs) && (post.is_video || post.is_reddit_media_domain)
    ).map(async redditPost => {
      if (hasIDRG(redditPost.url)) {
        const redgif = await getGIFs(extractIdRG(redditPost.url)!);

        if (redgif.error || !redgif.gifs.length) {
          console.error("Error loading redgif: ", redditPost.url);
          return null;
        }

        const url = extractURLRG(redgif.gifs[0].urls);
        const thumbnail = extractThumbnailRG(redgif.gifs[0].urls);
        const duration = redgif.gifs[0].duration;
        
        if (!url) {
          console.error("Failed to extract URL from redgif:", redgif.gifs[0].urls);
          return null;
        }
        
        return {
          id: generateMediaId(url, itemCounter++),
          type: "video",
          url,
          thumbnail,
          duration,
          name: redditPost.title,
          description: redditPost.selftext||undefined,
        };
      } else {
        if (!redditPost.url) {
          console.error("Reddit post missing URL:", redditPost);
          return null;
        }

        // Check if it's a Reddit video (v.redd.it URL or is_video flag)
        const isRedditVideo = redditPost.is_video || redditPost.url.includes('v.redd.it');
        
        if (isRedditVideo) {
          // For Reddit videos, try to get the actual video URL from media object
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
            // Use provided thumbnail if it's valid
            // Decode HTML entities in thumbnail URL if needed
            thumbnail = redditPost.thumbnail.replace(/&amp;/g, '&');
          }

          return {
            id: generateMediaId(videoUrl, itemCounter++),
            type: "video",
            url: videoUrl,
            thumbnail: thumbnail || undefined,
            name: redditPost.title,
            description: redditPost.selftext||undefined,
          };
        } else {
          // It's an image
          return {
            id: generateMediaId(redditPost.url, itemCounter++),
            name: redditPost.title,
            description: redditPost.selftext||undefined,
            type: "image",
            url: redditPost.url,
          };
        }
      }
    }))).filter(Boolean) as MediaItem[];

    
    subredditBank[subreddit] = posts;
    return posts;
  }

  for (const type of allTypes) {
    // Handle "All" type - use _AllTypes from types.json
    if (type === "All") {
      const typeConfig = types["_AllTypes"] as (string|number)[] | undefined;
      // For "All", we need to process each type in _AllTypes
      if (typeConfig && Array.isArray(typeConfig)) {
        const allTypesList = typeConfig.filter((t): t is string => typeof t === "string");
        for (const subType of allTypesList) {
          if (!types[subType] || !Array.isArray(types[subType])) {
            console.warn(`Sub-type "${subType}" not found in types.json or is not an array`);
            continue;
          }
          
          const acceptsRedGifs = !((types["_NoRedGifs"]||[]) as string[]).includes(subType);
          const subreddits = randomize(...types[subType]);
          const mainSubreddits = subreddits.reduce((acc, curr) => {
            if (acc.includes(curr)) return acc;
            acc.push(curr);
            return acc;
          }, [] as string[]);
          const mainSubredditsPosts = Object.fromEntries(await Promise.all(mainSubreddits.map(async (subreddit) => [subreddit, await getPosts(subreddit, acceptsRedGifs)] as [string, MediaItem[]])));
          const existingMedia = allMedia["All"] || [];
          const filteredPosts = Object.fromEntries(Object.entries(mainSubredditsPosts).map(([subreddit, posts]) => [subreddit, posts.filter(post => !existingMedia.map(x=>x.url).includes(post.url))]));

          const finalPosts: string[] = [];

          function finalPost(subreddit: string, remaining?: string[]): MediaItem|null {
            const subredditPosts = filteredPosts[subreddit] || [];
            const post = subredditPosts.filter(x=>x&&!finalPosts.includes(x.url))[0];

            if (!post) {
              const remaining_ = remaining || [...subreddits, ...types[subType].filter(x=>typeof x === "string"&&!subreddits.includes(x)).sort(()=>Math.random()-0.5) as string[]].filter(x=>x!=subreddit);
              if (remaining_.length)
                return finalPost(choose(...remaining_), remaining_);
              else
                return null;
            } else {
              finalPosts.push(post.url);
              return post;
            }
          }
          
          const posts = subreddits.map(p=>finalPost(p)).filter(Boolean) as MediaItem[];

          newMedia.push(...posts);
          appendMediaItems("All", posts);
        }
        continue;
      } else {
        console.warn(`"_AllTypes" not found in types.json or is not an array`);
        continue;
      }
    }
    
    // Skip if type doesn't exist in types object
    if (!types[type] || !Array.isArray(types[type])) {
      console.warn(`Type "${type}" not found in types.json or is not an array`);
      continue;
    }

    const acceptsRedGifs = !((types["_NoRedGifs"]||[]) as string[]).includes(type);
    const subreddits = randomize(...types[type]);
    const mainSubreddits = subreddits.reduce((acc, curr) => {
      if (acc.includes(curr)) return acc;
      acc.push(curr);
      return acc;
    }, [] as string[]);
    const mainSubredditsPosts = Object.fromEntries(await Promise.all(mainSubreddits.map(async (subreddit) => [subreddit, await getPosts(subreddit, acceptsRedGifs)] as [string, MediaItem[]])));
    const existingMedia = allMedia[type] || [];
    const filteredPosts = Object.fromEntries(Object.entries(mainSubredditsPosts).map(([subreddit, posts]) => [subreddit, posts.filter(post => !existingMedia.map(x=>x.url).includes(post.url))]));

    const finalPosts: string[] = [];

    function finalPost(subreddit: string, remaining?: string[]): MediaItem|null {
      const subredditPosts = filteredPosts[subreddit] || [];
      const post = subredditPosts.filter(x=>x&&!finalPosts.includes(x.url))[0];

      if (!post) {
        const remaining_ = remaining || [...subreddits, ...types[type].filter(x=>typeof x === "string"&&!subreddits.includes(x)).sort(()=>Math.random()-0.5) as string[]].filter(x=>x!=subreddit);
        if (remaining_.length)
          return finalPost(choose(...remaining_), remaining_);
        else
          return null;
      } else {
        finalPosts.push(post.url);
        return post;
      }
    }
    
    const posts = subreddits.map(p=>finalPost(p)).filter(Boolean) as MediaItem[];

    newMedia.push(...posts);
    appendMediaItems(type, posts);
  }

  return newMedia;
}

export async function getMediaItems(type: string, limit: number = ITEMS_PER_PAGE): Promise<MediaItem[]> {
    const mediaList = getMedia(type);

    if (mediaList.length >= limit)
      return mediaList.slice(0, limit);
    else {
      await generateMediaItems(type);
      return getMediaItems(type, limit);
    }
}

const gotMediaItems = {} as Record<string, MediaItem[]>;

export async function mediaItems(type: string, limit: number = ITEMS_PER_PAGE): Promise<MediaItem[]> {
  const start = gotMediaItems[type]?.length || 0;
  const mediaList = (await getMediaItems(type, start + limit)).slice().reverse();
  gotMediaItems[type] = mediaList;
  return mediaList.slice(start);
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
