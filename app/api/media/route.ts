import { NextRequest, NextResponse } from "next/server";
import { mediaItems, clearMediaCache, generateMediaItems } from "@/lib/media";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "All";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "24", 10), 1), 100); // Clamp between 1 and 100
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0); // Offset for pagination
    const reset = searchParams.get("reset") === "true";
    const refresh = searchParams.get("refresh") === "true";

    // Clear cache if reset is requested (no-op but kept for compatibility)
    if (reset) {
      clearMediaCache(type);
    }

    // Generate/refresh media items if requested
    if (refresh) {
      await generateMediaItems(type);
    }

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

