import { mediaItems, getTypes, ITEMS_PER_PAGE } from "@/lib/media";
import { GalleryClient } from "@/components/gallery-client";

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const initialType = "All";
  
  // Fetch initial data on the server
  const [initialItems, types] = await Promise.all([
    mediaItems(initialType, ITEMS_PER_PAGE, 0),
    Promise.resolve(getTypes()),
  ]);

  return (
    <GalleryClient
      initialItems={initialItems}
      initialType={initialType}
      types={types}
    />
  );
}

