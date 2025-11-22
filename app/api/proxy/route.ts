import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    // Only allow certain domains for security
    const allowedDomains = [
      'i.redd.it',
      'v.redd.it',
      'redgifs.com',
      'i.redgifs.com',
      'preview.redd.it',
      'external-preview.redd.it',
      'thumbs.redgifs.com',
      'cdn.redgifs.com',
      'v3.redgifs.com',
    ];

    const hostname = targetUrl.hostname.toLowerCase();
    const isAllowed = allowedDomains.some(domain => {
      // Exact match
      if (hostname === domain) return true;
      // Subdomain match (e.g., cdn.redgifs.com matches redgifs.com)
      if (hostname.endsWith('.' + domain)) return true;
      // For redgifs.com, also allow any subdomain
      if (domain === 'redgifs.com' && hostname.includes('.redgifs.com')) return true;
      return false;
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403 }
      );
    }

    // Fetch the resource
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': url,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Get the blob
    const blob = await response.blob();

    // Return the blob with appropriate headers
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || blob.size.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

