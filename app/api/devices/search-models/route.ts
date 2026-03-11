import { NextResponse } from "next/server";
import { searchModels } from "@/lib/sketchfab/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";

  return NextResponse.json({ results: await searchModels(query) });
}
