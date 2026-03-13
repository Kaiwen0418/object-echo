import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

page.on("pageerror", (error) => {
  console.error("PAGEERROR:", error.message);
});

page.on("console", (message) => {
  if (message.type() === "error") {
    console.error("CONSOLE:", message.text());
  }
});

await page.goto("http://127.0.0.1:3002", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.15, behavior: "instant" }));
await page.waitForTimeout(1400);
await page.screenshot({ path: "tmp/museum-home-shot.png", fullPage: false });

await browser.close();
