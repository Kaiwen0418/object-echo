import "server-only";

import { headers } from "next/headers";

export async function getRequestOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");

  if (!host) {
    return undefined;
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}
