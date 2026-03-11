import { NextResponse } from "next/server";
import { matchDeviceSpecs } from "@/lib/utils/device-matcher";

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; year?: number };
  const name = body.name ?? "";
  const year = body.year ?? new Date().getFullYear();

  return NextResponse.json(matchDeviceSpecs(name, year));
}
