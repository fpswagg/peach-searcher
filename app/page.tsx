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
  
  // Fetch initial data on the server
  const [initialItems, types] = await Promise.all([
    mediaItems(initialType, ITEMS_PER_PAGE, 0),
    Promise.resolve(getTypes()),
  ]);

  return (
    <GalleryClient
      initialItems={initialItems}
      initialType={initialType}
      initialFilter={initialFilter}
      types={types}
    />
  );
}

