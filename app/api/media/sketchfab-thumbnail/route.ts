import { NextResponse } from "next/server";

const ALLOWED_HOSTNAME = "media.sketchfab.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter." }, { status: 400 });
  }

  if (targetUrl.protocol !== "https:" || targetUrl.hostname !== ALLOWED_HOSTNAME) {
    return NextResponse.json({ error: "Unsupported thumbnail host." }, { status: 400 });
  }

  const upstream = await fetch(targetUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Thumbnail fetch failed." }, { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=86400"
    }
  });
}
