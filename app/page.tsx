"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MediaItem, mediaItems, ITEMS_PER_PAGE } from "@/data/media";
import { MediaCard } from "@/components/media-card";
import { MediaDialog } from "@/components/media-dialog";
import { Image as ImageIcon, Video, Filter } from "lucide-react";

export type FilterType = "all" | "image" | "video";

export default function GalleryPage() {
  const [loadedCount, setLoadedCount] = useState(ITEMS_PER_PAGE);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter media items based on selected filter
  const filteredItems = useMemo(() => {
    if (filter === "all") return mediaItems;
    return mediaItems.filter((item) => item.type === filter);
  }, [filter]);

  // Get items to display (loaded items from filtered list)
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, loadedCount);
  }, [filteredItems, loadedCount]);

  const hasMore = loadedCount < filteredItems.length;

  // Load more items when scrolling
  const loadMore = useCallback(() => {
    if (hasMore) {
      setLoadedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredItems.length));
    }
  }, [hasMore, filteredItems.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
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
  }, [hasMore, loadMore]);

  // Reset loaded count when filter changes
  useEffect(() => {
    setLoadedCount(ITEMS_PER_PAGE);
  }, [filter]);

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
          {displayedItems.length === 0 && filteredItems.length > 0 && (
            <p className="text-lg text-base-content/70">
              <span className="loading loading-spinner loading-md text-primary mr-2"></span>
              {filter === "all" ? "Loading beautiful images and videos" : filter === "image" ? "Loading images" : "Loading videos"}
            </p>
          )}
        </div>

        {/* Filter */}
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
        {displayedItems.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              {displayedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  showBadge={filter === "all"}
                />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && displayedItems.length > 0 && (
              <div className="text-center py-8 text-base-content/60">
                <p>You&apos;ve reached the end!</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            {filteredItems.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-lg text-base-content/60">Loading media...</p>
              </div>
            ) : (
              <p className="text-lg text-base-content/60">No items found with the selected filter.</p>
            )}
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

