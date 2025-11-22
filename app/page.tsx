"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MediaItem } from "@/types/media";

const ITEMS_PER_PAGE = 24;
import { MediaCard } from "@/components/media-card";
import { MediaDialog } from "@/components/media-dialog";
import { Image as ImageIcon, Video, Filter } from "lucide-react";

export type FilterType = "all" | "image" | "video";

export default function GalleryPage() {
  const [allItems, setAllItems] = useState<MediaItem[]>([]); // Store ALL items (unfiltered)
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [currentType, setCurrentType] = useState<string>("All");
  const [types, setTypes] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch available types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('/api/types');
        const result = await response.json();
        if (result.success) {
          setTypes(result.data);
        }
      } catch (error) {
        console.error("Error fetching types:", error);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // Fetch media items from API
  const fetchMediaItems = useCallback(async (type: string, limit: number, append: boolean = false, mediaFilter?: FilterType) => {
    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

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
      // On network error, don't clear existing items
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [allItems.length]);

  // Initial load - reload when type or filter changes
  useEffect(() => {
    setAllItems([]);
    setHasMoreItems(true);
    fetchMediaItems(currentType, ITEMS_PER_PAGE, false, filter);
  }, [currentType, filter, fetchMediaItems]);

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

        {/* Type Selector */}
        {!isLoadingTypes && (
          <div className="mb-8 flex justify-center">
            <div className="join flex-wrap justify-center gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setCurrentType(type);
                    // Items will be cleared and reloaded in the useEffect
                  }}
                  className={`btn join-item ${currentType === type ? "btn-primary" : "btn-outline"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Media Type Filter */}
        <div className="mb-8 flex justify-center">
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

