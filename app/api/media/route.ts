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

    // Fetch all items without limit - server generates all available media
    // Then apply filtering and pagination
    // Use a very large limit to fetch all generated items
    const allItems = await mediaItems(type, 100000, 0);
    
    // Apply server-side filtering first
    let filteredItems = allItems;
    if (filter === "image") {
      filteredItems = allItems.filter(item => item.type === "image");
    } else if (filter === "video") {
      filteredItems = allItems.filter(item => item.type === "video");
    }
    
    // Apply pagination after filtering
    const resultItems = filteredItems.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: resultItems,
      type,
      filter,
      limit,
      offset,
      count: resultItems.length,
      hasMore: offset + limit < filteredItems.length, // Indicate if there are more filtered items
      totalFiltered: filteredItems.length, // Total count of filtered items
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

