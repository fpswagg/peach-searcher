import { NextRequest, NextResponse } from "next/server";
import { mediaItems, clearMediaCache, generateMediaItems } from "@/lib/media";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "All";
    const limit = Math.max(parseInt(searchParams.get("limit") || "24", 10), 1);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0); // Offset for pagination
    const reset = searchParams.get("reset") === "true";
    const refresh = searchParams.get("refresh") === "true";

    // Clear cache if reset is requested (client-side cache clearing)
    if (reset) 
      clearMediaCache(type);

    // Fetch items - server always generates fresh data
    // Client-side caching is handled by gallery-client component
    const items = await mediaItems(type, limit, offset);
    
    return NextResponse.json({
      success: true,
      data: items,
      type,
      limit,
      offset,
      count: items.length,
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

