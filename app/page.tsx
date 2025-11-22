import { mediaItems, getTypes, ITEMS_PER_PAGE } from "@/lib/media";
import { GalleryClient } from "@/components/gallery-client";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    type?: string;
    filter?: string;
  };
}

export default async function GalleryPage({ searchParams }: PageProps) {
  // Get type and filter from query params, with defaults
  const initialType = searchParams.type || "All";
  const initialFilter = (searchParams.filter === "image" || searchParams.filter === "video") 
    ? searchParams.filter 
    : "all";
  
  // Fetch all available data on the server (no limit)
  const [allItems, types] = await Promise.all([
    mediaItems(initialType, 100000, 0), // Fetch all items
    Promise.resolve(getTypes()),
  ]);

  // Apply server-side filtering
  let filteredItems = allItems;
  if (initialFilter === "image") {
    filteredItems = allItems.filter(item => item.type === "image");
  } else if (initialFilter === "video") {
    filteredItems = allItems.filter(item => item.type === "video");
  }
  
  // Return first page of filtered items
  const initialItems = filteredItems.slice(0, ITEMS_PER_PAGE);

  return (
    <GalleryClient
      initialItems={initialItems}
      initialType={initialType}
      initialFilter={initialFilter}
      types={types}
    />
  );
}

