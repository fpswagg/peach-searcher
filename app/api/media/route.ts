import { NextRequest, NextResponse } from "next/server";
import { mediaItems } from "@/lib/media";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "All";
    const limit = parseInt(searchParams.get("limit") || "24", 10);

    const items = await mediaItems(type, limit);
    
    return NextResponse.json({
      success: true,
      data: items,
      type,
      limit,
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

