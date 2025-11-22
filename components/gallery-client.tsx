"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  initialFilter: FilterType;
  types: string[];
}

export function GalleryClient({ initialItems, initialType, initialFilter, types }: GalleryClientProps) {
  // Don't use cache when filter is applied - cache doesn't respect filters
  // Only use cache if filter is "all" and we have cached items
  const cachedItems = typeof window !== "undefined" && initialFilter === "all" ? getCachedMedia(initialType) : null;
  const initialData = cachedItems || initialItems;
  const [allItems, setAllItems] = useState<MediaItem[]>(initialData); // Store items (already filtered server-side)
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter] = useState<FilterType>(initialFilter); // Read-only, changes cause page reload
  const [currentType] = useState<string>(initialType); // Read-only, changes cause page reload
  const observerTarget = useRef<HTMLDivElement>(null);

  // Update URL query params and reload page when type or filter changes
  const updateQueryParams = useCallback((type: string, filter: FilterType) => {
    const params = new URLSearchParams();
    
    if (type && type !== "All") {
      params.set("type", type);
    }
    
    if (filter && filter !== "all") {
      params.set("filter", filter);
    }
    
    // Reload page with new query params
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.location.href = newUrl;
  }, []);

  // Save initial items to cache if we have them and no cache exists
  // Only cache when filter is "all" to avoid caching filtered results
  useEffect(() => {
    if (typeof window !== "undefined" && initialItems.length > 0 && !cachedItems && initialFilter === "all") {
      saveCachedMedia(initialType, initialItems);
    }
  }, [initialType, initialItems, cachedItems, initialFilter]);

  // No need to sync with URL - page will reload on changes

  // Fetch media items from API (server-side filtering is applied)
  const fetchMediaItems = useCallback(async (type: string, limit: number, append: boolean = false) => {
    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      // Calculate offset based on current items count
      const offset = append ? allItems.length : 0;
      
      // Build API URL with current filter
      const apiUrl = `/api/media?type=${encodeURIComponent(type)}&limit=${limit}&offset=${offset}${filter !== "all" ? `&filter=${filter}` : ""}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success) {
        const newItems = result.data || [];
        
        // Save to cache only if filter is "all" (don't cache filtered results)
        if (typeof window !== "undefined" && filter === "all") {
          if (append) {
            appendCachedMedia(type, result.data);
          } else {
            saveCachedMedia(type, result.data);
          }
        }
        
        // Check if we've reached the end
        // Use hasMore from server if available, otherwise check item count
        const hasMore = result.hasMore !== undefined ? result.hasMore : newItems.length >= limit;
        setHasMoreItems(hasMore);
        
        if (append) {
          setAllItems((prev) => [...prev, ...newItems]);
        } else {
          setAllItems(newItems);
          setHasMoreItems(hasMore);
        }
      } else {
        console.error("Error fetching media:", result.error);
        setHasMoreItems(false);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
      setHasMoreItems(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [allItems.length, filter]);

  // No need to handle type/filter changes - page reloads on change
  // Items are already filtered server-side, so use them directly
  const filteredItems = allItems;

  // Load more items when scrolling
  const loadMore = useCallback(() => {
    if (hasMoreItems && !isLoadingMore && !isLoading) {
      fetchMediaItems(currentType, ITEMS_PER_PAGE, true);
    }
  }, [hasMoreItems, isLoadingMore, isLoading, currentType, fetchMediaItems]);

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
              onChange={(e) => {
                const newType = e.target.value;
                updateQueryParams(newType, filter);
              }}
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
                onClick={() => updateQueryParams(currentType, "all")}
                className={`btn join-item ${filter === "all" ? "btn-primary" : "btn-outline"}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                All
              </button>
              <button
                onClick={() => updateQueryParams(currentType, "image")}
                className={`btn join-item ${filter === "image" ? "btn-primary" : "btn-outline"}`}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Images
              </button>
              <button
                onClick={() => updateQueryParams(currentType, "video")}
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
      {selectedItem && (
        <MediaDialog
          item={selectedItem}
          items={filteredItems}
          currentIndex={Math.max(0, filteredItems.findIndex(item => item.id === selectedItem.id))}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onItemChange={(item, index) => {
            setSelectedItem(item);
          }}
        />
      )}
    </div>
  );
}

