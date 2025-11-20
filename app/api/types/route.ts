import { NextResponse } from "next/server";
import { getTypes } from "@/lib/media";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const types = getTypes();
    
    return NextResponse.json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error("Error fetching types:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

