import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    // Check if it's a short URL (e.g. goo.gl, maps.app.goo.gl)
    if (
      trimmedUrl.includes("maps.app.goo.gl") ||
      trimmedUrl.includes("goo.gl/maps") ||
      trimmedUrl.includes("bit.ly")
    ) {
      try {
        const response = await fetch(trimmedUrl, {
          method: "HEAD",
          redirect: "follow",
        });
        const finalUrl = response.url;
        return NextResponse.json({ resolvedUrl: finalUrl });
      } catch {
        // If HEAD fails, try GET
        const response = await fetch(trimmedUrl, {
          method: "GET",
          redirect: "follow",
        });
        const finalUrl = response.url;
        return NextResponse.json({ resolvedUrl: finalUrl });
      }
    }

    return NextResponse.json({ resolvedUrl: trimmedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve link" },
      { status: 500 },
    );
  }
}
