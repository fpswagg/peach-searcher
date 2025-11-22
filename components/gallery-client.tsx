"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MediaItem } from "@/types/media";
import { MediaCard } from "@/components/media-card";
import { MediaDialog } from "@/components/media-dialog";
import { Image as ImageIcon, Video, Filter } from "lucide-react";
import { getCachedMedia, saveCachedMedia, appendCachedMedia } from "@/lib/media-storage";

const ITEMS_PER_PAGE = 24;

export type FilterType = "all" | "image" | "video";

interface GalleryClientProps {
  initialItems: MediaItem[];
  initialType: string;
  types: string[];
}

export function GalleryClient({ initialItems, initialType, types }: GalleryClientProps) {
  // Try to load from cache first, fallback to initialItems
  const cachedItems = typeof window !== "undefined" ? getCachedMedia(initialType) : null;
  const [allItems, setAllItems] = useState<MediaItem[]>(cachedItems || initialItems); // Store ALL items (unfiltered)
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [currentType, setCurrentType] = useState<string>(initialType);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Save initial items to cache if we have them and no cache exists
  useEffect(() => {
    if (typeof window !== "undefined" && initialItems.length > 0 && !cachedItems) {
      saveCachedMedia(initialType, initialItems);
    }
  }, [initialType, initialItems, cachedItems]);

  // Fetch media items from API
  const fetchMediaItems = useCallback(async (type: string, limit: number, append: boolean = false, mediaFilter?: FilterType) => {
    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      // Check cache first if not appending
      if (!append && typeof window !== "undefined") {
        const cached = getCachedMedia(type);
        if (cached && cached.length > 0) {
          // Apply filter to cached items
          let filteredCached = cached;
          if (mediaFilter && mediaFilter !== "all") {
            filteredCached = cached.filter((item: MediaItem) => item.type === mediaFilter);
          }
          
          // Show first page of cached items immediately
          const cachedPage = filteredCached.slice(0, limit);
          setAllItems(cachedPage);
          setHasMoreItems(filteredCached.length > limit || cached.length > limit);
          setIsLoading(false);
          
          // Fetch fresh data in background to update cache
          fetch(`/api/media?type=${encodeURIComponent(type)}&limit=${limit}&offset=0`)
            .then(res => res.json())
            .then(result => {
              if (result.success && result.data) {
                saveCachedMedia(type, result.data);
                // Update items if we're still on first page (type check happens via closure)
                setAllItems((prevItems) => {
                  // Only update if we haven't changed type and still on first page
                  if (prevItems.length <= limit) {
                    let filtered = result.data;
                    if (mediaFilter && mediaFilter !== "all") {
                      filtered = result.data.filter((item: MediaItem) => item.type === mediaFilter);
                    }
                    return filtered.slice(0, limit);
                  }
                  return prevItems;
                });
                setHasMoreItems(result.data.length >= limit);
              }
            })
            .catch(err => console.error("Background fetch error:", err));
          
          return;
        }
      }

      // For pagination, check cache first if appending
      if (append && typeof window !== "undefined") {
        const cached = getCachedMedia(type);
        if (cached && cached.length > 0) {
          // We need to find how many unfiltered items we've already displayed
          // Since allItems might be filtered, we need to track this differently
          // For now, we'll use a simpler approach: continue through cache and filter
          const allCachedFiltered = mediaFilter && mediaFilter !== "all" 
            ? cached.filter((item: MediaItem) => item.type === mediaFilter)
            : cached;
          
          // Calculate how many filtered items we've shown
          const filteredItemsShown = allItems.length;
          const remainingFiltered = allCachedFiltered.slice(filteredItemsShown);
          
          if (remainingFiltered.length > 0) {
            const itemsToAdd = remainingFiltered.slice(0, limit);
            setAllItems((prev) => [...prev, ...itemsToAdd]);
            setHasMoreItems(remainingFiltered.length > limit || cached.length > allCachedFiltered.length);
            setIsLoadingMore(false);
            
            // Still fetch in background to update cache (use cache length as server offset)
            const serverOffset = cached.length;
            fetch(`/api/media?type=${encodeURIComponent(type)}&limit=${limit}&offset=${serverOffset}`)
              .then(res => res.json())
              .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                  appendCachedMedia(type, result.data);
                }
              })
              .catch(err => console.error("Background fetch error:", err));
            
            return;
          }
        }
      }

      // Calculate offset based on ALL items (not filtered) - this is the server's view
      const offset = append ? allItems.length : 0;
      
      // If filtering, we need to fetch more items to account for filtering
      // Estimate: if filtering, fetch 2x to ensure we get enough after filtering
      const fetchLimit = (mediaFilter && mediaFilter !== "all") ? limit * 2 : limit;
      
      const response = await fetch(`/api/media?type=${encodeURIComponent(type)}&limit=${fetchLimit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success) {
        let newItems = result.data || [];
        
        // Save to cache (save all items from server, not filtered)
        if (typeof window !== "undefined") {
          if (append) {
            appendCachedMedia(type, result.data);
          } else {
            saveCachedMedia(type, result.data);
          }
        }
        
        // Apply client-side filter if specified (for images/videos only)
        if (mediaFilter && mediaFilter !== "all") {
          newItems = newItems.filter((item: MediaItem) => item.type === mediaFilter);
        }
        
        // Check if we've reached the end
        // If we got fewer items than requested (after filtering), we might have reached the end
        // But we need to check if the server returned fewer items than requested
        const serverReturnedLess = (result.data?.length || 0) < fetchLimit;
        if (serverReturnedLess && newItems.length < limit) {
          setHasMoreItems(false);
        } else if (newItems.length >= limit) {
          setHasMoreItems(true);
        } else {
          // We got some items but not enough - might have more, try to be optimistic
          setHasMoreItems(!serverReturnedLess);
        }
        
        if (append) {
          setAllItems((prev) => [...prev, ...newItems]);
        } else {
          setAllItems(newItems);
          setHasMoreItems(true); // Reset when loading new type
        }
      } else {
        console.error("Error fetching media:", result.error);
        setHasMoreItems(false);
        // Don't clear items on error, keep what we have
      }
    } catch (error) {
      console.error("Error fetching media:", error);
      setHasMoreItems(false);
      // On network error, try to use cache if available
      if (!append && typeof window !== "undefined") {
        const cached = getCachedMedia(type);
        if (cached && cached.length > 0) {
          let filteredCached = cached;
          if (mediaFilter && mediaFilter !== "all") {
            filteredCached = cached.filter((item: MediaItem) => item.type === mediaFilter);
          }
          setAllItems(filteredCached);
        }
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [allItems.length]);

  // Reload when type or filter changes (but not on initial mount)
  const isInitialMount = useRef(true);
  const currentTypeRef = useRef(currentType);
  const filterRef = useRef(filter);
  
  // Keep refs in sync
  useEffect(() => {
    currentTypeRef.current = currentType;
    filterRef.current = filter;
  }, [currentType, filter]);
  
  useEffect(() => {
    // Skip initial mount - we already have initialItems or cached items
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const type = currentTypeRef.current;
    const mediaFilter = filterRef.current;
    
    // Check cache first when switching types
    if (typeof window !== "undefined") {
      const cached = getCachedMedia(type);
      if (cached && cached.length > 0) {
        let filteredCached = cached;
        if (mediaFilter !== "all") {
          filteredCached = cached.filter((item: MediaItem) => item.type === mediaFilter);
        }
        // Show first page from cache
        setAllItems(filteredCached.slice(0, ITEMS_PER_PAGE));
        setHasMoreItems(filteredCached.length > ITEMS_PER_PAGE || cached.length > ITEMS_PER_PAGE);
        // Still fetch in background to update cache
        fetchMediaItems(type, ITEMS_PER_PAGE, false, mediaFilter);
        return;
      }
    }
    
    setAllItems([]);
    setHasMoreItems(true);
    fetchMediaItems(type, ITEMS_PER_PAGE, false, mediaFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentType, filter]);

  // Filter media items based on selected filter (client-side for already loaded items)
  const filteredItems = useMemo(() => {
    if (filter === "all") return allItems;
    return allItems.filter((item) => item.type === filter);
  }, [allItems, filter]);

  // Load more items when scrolling
  const loadMore = useCallback(() => {
    if (hasMoreItems && !isLoadingMore && !isLoading) {
      // When loading more, we need to fetch more items and then filter
      // Since we're filtering client-side, we fetch more to account for filtering
      const fetchLimit = filter === "all" ? ITEMS_PER_PAGE : ITEMS_PER_PAGE * 2; // Fetch more if filtering
      fetchMediaItems(currentType, fetchLimit, true, filter);
    }
  }, [hasMoreItems, isLoadingMore, isLoading, currentType, filter, fetchMediaItems]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreItems && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMoreItems, isLoadingMore, isLoading, loadMore]);

  const handleItemClick = (item: MediaItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-3 text-base-content">Media Gallery</h1>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap justify-center items-end gap-4">
          {/* Type Selector */}
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text text-sm font-medium text-base-content/70">Category</span>
            </label>
            <select
              value={currentType}
              onChange={(e) => setCurrentType(e.target.value)}
              className="select select-bordered w-full min-w-[180px] focus:select-primary"
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Media Type Filter */}
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text text-sm font-medium text-base-content/70">Media Type</span>
            </label>
            <div className="join">
              <button
                onClick={() => setFilter("all")}
                className={`btn join-item ${filter === "all" ? "btn-primary" : "btn-outline"}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                All
              </button>
              <button
                onClick={() => setFilter("image")}
                className={`btn join-item ${filter === "image" ? "btn-primary" : "btn-outline"}`}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Images
              </button>
              <button
                onClick={() => setFilter("video")}
                className={`btn join-item ${filter === "video" ? "btn-primary" : "btn-outline"}`}
              >
                <Video className="w-4 h-4 mr-2" />
                Videos
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Grid Layout */}
        {isLoading && filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-lg text-base-content/60">Loading media...</p>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              {filteredItems.map((item, index) => (
                <MediaCard
                  key={item.id || `item-${index}-${item.url}`}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  showBadge={filter === "all"}
                />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasMoreItems && (
              <div ref={observerTarget} className="flex justify-center items-center py-8">
                {isLoadingMore && (
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                )}
              </div>
            )}

            {/* End of Results */}
            {!hasMoreItems && filteredItems.length > 0 && !isLoadingMore && (
              <div className="text-center py-8 text-base-content/60">
                <p>You&apos;ve reached the end!</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-base-content/60">No items found with the selected filter.</p>
          </div>
        )}
      </div>

      {/* Media Dialog */}
      <MediaDialog
        item={selectedItem}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}

