import { NextRequest, NextResponse } from "next/server";
import { mediaItems, clearMediaCache, generateMediaItems } from "@/lib/media";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "All";
    const limit = Math.max(parseInt(searchParams.get("limit") || "24", 10), 1);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const filter = searchParams.get("filter") || "all"; // "all" | "image" | "video"
    const reset = searchParams.get("reset") === "true";
    const refresh = searchParams.get("refresh") === "true";

    // Clear cache if reset is requested (client-side cache clearing)
    if (reset) 
      clearMediaCache(type);

    // Fetch items - server always generates fresh data
    // When filtering, we need to fetch more items to account for filtering
    // Then filter and return the requested amount
    const fetchLimit = filter !== "all" ? limit * 3 : limit; // Fetch 3x when filtering to ensure we get enough
    const items = await mediaItems(type, fetchLimit, offset);
    
    // Apply server-side filtering
    let filteredItems = items;
    if (filter === "image") {
      filteredItems = items.filter(item => item.type === "image");
    } else if (filter === "video") {
      filteredItems = items.filter(item => item.type === "video");
    }
    
    // Return only the requested limit (first N filtered items)
    const resultItems = filteredItems.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: resultItems,
      type,
      filter,
      limit,
      offset,
      count: resultItems.length,
      hasMore: filteredItems.length > limit, // Indicate if there are more filtered items
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

