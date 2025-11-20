import axios from 'axios';
import qs from 'qs';
import { minutes } from './time';
import { wait } from './async';

export type CriteriaFunction<T = any> = (object: T) => boolean;

export interface RedditGalleryData {
    items: {
        media_id: string;
        id: number;
    }[];
}

export interface RedditMediaMetadata {
    status: string;
    e: string;
    m: string;
    o?: { y: number; x: number; u: string }[];
    p: { y: number; x: number; u: string }[];
    s: { y: number; x: number; u: string };
    id: string;
}

export interface RedditPost {
    all_awardings: Record<string, any>[];
    allow_live_comments: boolean;
    approved_at_utc: null | number;
    approved_by: null | string;
    archived: boolean;
    author: string;
    author_flair_background_color: null | string;
    author_flair_css_class: null | string;
    author_flair_richtext: Record<string, any>[];
    author_flair_template_id: null | string;
    author_flair_text: null | string;
    author_flair_text_color: null | string;
    author_flair_type: string;
    author_fullname: string;
    author_is_blocked: boolean;
    author_patreon_flair: boolean;
    author_premium: boolean;
    awarders: Record<string, any>[];
    banned_at_utc: null | number;
    banned_by: null | string;
    category: null | string;
    clicked: boolean;
    contest_mode: boolean;
    content_categories: null | string;
    created: number;
    created_utc: number;
    discussion_type: null | string;
    distinguished: null | string;
    domain: string;
    downs: number;
    edited: boolean | number;
    gallery_data?: RedditGalleryData;
    gilded: number;
    gildings: Record<string, any>;
    hide_score: boolean;
    hidden: boolean;
    id: string;
    is_created_from_ads_ui: boolean;
    is_crosspostable: boolean;
    is_meta: boolean;
    is_original_content: boolean;
    is_reddit_media_domain: boolean;
    is_robot_indexable: boolean;
    is_self: boolean;
    is_video: boolean;
    likes: null | boolean;
    link_flair_background_color: string;
    link_flair_css_class: null | string;
    link_flair_richtext: Record<string, any>[];
    link_flair_template_id: null | string;
    link_flair_text: null | string;
    link_flair_text_color: string;
    link_flair_type: string;
    locked: boolean;
    media: null | Record<string, any>;
    media_embed: Record<string, any>;
    media_only: boolean;
    media_metadata?: Record<string, RedditMediaMetadata>;
    mod_note: null | string;
    mod_reason_by: null | string;
    mod_reason_title: null | string;
    mod_reports: Record<string, any>[];
    name: string;
    no_follow: boolean;
    num_comments: number;
    num_crossposts: number;
    num_reports: null | number;
    over_18: boolean;
    permalink: string;
    pinned: boolean;
    pwls: null | number;
    quarantine: boolean;
    removal_reason: null | string;
    removed_by: null | string;
    removed_by_category: null | string;
    report_reasons: null | Record<string, any>[];
    saved: boolean;
    score: number;
    secure_media: null | Record<string, any>;
    secure_media_embed: Record<string, any>;
    selftext: string;
    selftext_html: null | string;
    send_replies: boolean;
    spoiler: boolean;
    stickied: boolean;
    subreddit: string;
    subreddit_id: string;
    subreddit_name_prefixed: string;
    subreddit_subscribers: number;
    subreddit_type: string;
    suggested_sort: null | string;
    thumbnail: string;
    thumbnail_height: null | number;
    thumbnail_width: null | number;
    title: string;
    top_awarded_type: null | string;
    total_awards_received: number;
    treatment_tags: Record<string, any>[];
    ups: number;
    upvote_ratio: number;
    url: string;
    user_reports: Record<string, any>[];
    view_count: null | number;
    visited: boolean;
    wls: null | number;
}

export interface RedditMedia {
    url: string;
    mime: string;

    width?: number;
    height?: number;

    caption?: string;
}

export type RedgifGIF = {
    id: string;
    type: number;
    userName: string;
    published: boolean;
    verified: boolean;
    views: number;
    duration: number;
    tags: string[];
    niches: string[];
    urls: RedgifUrlData;
    hls: boolean;
    hasAudio?: boolean;
};

export type RedgifUrlData = {
    hd?: string;
    sd?: string;
    thumbnail?: string;
    vthumbnail?: string;
    poster?: string;
    gif?: string;
};

export type PostType = 'hot' | 'new' | 'top' | 'rising' | 'controversial';

export const redditAppName = process.env.REDDIT_APP_NAME;
export const redditUserName = process.env.REDDIT_USERNAME;
export const redditID = process.env.REDDIT_ID;
export const redditSecret = process.env.REDDIT_SECRET;

export async function getRedditPosts(
    subreddit = 'all',
    limit?: number,
    type: PostType = 'new'
): Promise<{ data: RedditPost[]; error?: Error }> {
    try {
        const token = await getRedditToken();
        const defaultLimit = 100;

        if (!token) throw new Error('There is no token!');

        const { data } = await axios.get<{
            data?: {
                children?: {
                    data: RedditPost;
                }[];
            };
        }>(
            `https://oauth.reddit.com/${subreddit.startsWith('user/') ? subreddit : `r/${subreddit}`}/${type}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    limit:
                        limit == undefined
                            ? defaultLimit
                            : Math.min(defaultLimit, Math.max(0, limit)),
                },
            }
        );

        if (data?.data?.children)
            return {
                data: data.data.children.map((post) => post.data),
            };
        else throw new Error('There are no posts!');
    } catch (error) {
        return { data: [], error: error as Error };
    }
}

export let lastTokenFetchTime: number | null = null;

export async function getRedditToken() {
    const timeDelay = minutes(1 / 100);

    while (
        lastTokenFetchTime !== null &&
        Date.now() - lastTokenFetchTime < timeDelay
    )
        await wait(timeDelay + Date.now() - lastTokenFetchTime);

    lastTokenFetchTime = Date.now();

    const authHeader = Buffer.from(`${redditID}:${redditSecret}`).toString(
        'base64'
    );

    const data = qs.stringify({
        grant_type: 'client_credentials',
    });

    try {
        const response = await axios.post<{ access_token: string }>(
            'https://www.reddit.com/api/v1/access_token',
            data,
            {
                headers: {
                    Authorization: `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': redditAppName + '/1.0.0',
                },
            }
        );

        return response.data.access_token;
    } catch (error) {
        throw new Error('There was a problem while fetching the token.');
    }
}

export async function authenticateRG(): Promise<string> {
    const response = await axios.get<{ token: string }>(
        'https://api.redgifs.com/v2/auth/temporary'
    );

    return response.data.token;
}

export function extractIdRG(link: string) {
    if (/^https:\/\/www.redgifs.com\/watch\//.test(link)) {
        return (
            link
                .match(/(?<=https:\/\/www.redgifs.com\/watch\/).*/)?.[0]
                ?.replace(/(#|\?).*/g, '') ?? null
        );
    } else return null;
}

export function hasIDRG(link: string) {
    return !!(extractIdRG(link) ?? false);
}

export async function getGIFs(
    ids?: string[] | string
): Promise<{ gifs: RedgifGIF[]; error?: Error }> {
    try {
        const token = await authenticateRG();
        const response = await axios.get<{ gifs: RedgifGIF[] }>(
            ids
                ? `https://api.redgifs.com/v2/gifs?ids=${(typeof ids === 'string' ? [ids] : ids).join()}`
                : `https://api.redgifs.com/v2/feeds/trending/popular`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return { gifs: response.data.gifs };
    } catch (error) {
        return { gifs: [], error: error as Error };
    }
}

export function extractURLRG(urls: RedgifUrlData) {
    return (
        urls.sd ||
        urls.vthumbnail ||
        urls.hd ||
        Object.values(urls).find((value) =>
            ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].some((ext) =>
                value.toLowerCase().endsWith('.' + ext)
            )
        )
    );
}

export function extractThumbnailRG(urls: RedgifUrlData) {
    return (
        urls.thumbnail ||
        urls.poster ||
        Object.values(urls).find((value) =>
            ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'svg'].some((ext) =>
                value.toLowerCase().endsWith('.' + ext)
            )
        )
    );
}

export const hasAudioCriteria: CriteriaFunction<RedgifGIF> = (x) =>
    !!(x.hasAudio && x.urls);

export const niches = {
    ebony: ['african-queen', 'african-chicks'],
};

export type NicheType = keyof typeof niches;

export async function getNicheGIFs(
    niche: NicheType = Object.keys(niches)[0] as NicheType,
    criteria: CriteriaFunction<RedgifGIF> = hasAudioCriteria
): Promise<{ gifs: RedgifGIF[]; error?: Error }> {
    try {
        const token = await authenticateRG();

        return {
            gifs: (
                await Promise.all(
                    niches[niche].map(async function (niche) {
                        const response = await axios.get<{ gifs: RedgifGIF[] }>(
                            `https://api.redgifs.com/v2/niches/${niche}/gifs`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        return response.data.gifs.filter(criteria);
                    })
                )
            ).flat(),
        };
    } catch (error) {
        return { gifs: [], error: error as Error };
    }
}