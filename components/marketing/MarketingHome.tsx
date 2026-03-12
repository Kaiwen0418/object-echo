import { demoBundle } from "@/data/demo/projects";
import { HomeMuseumShowcase } from "@/features/museum/HomeMuseumShowcase";

export function MarketingHome() {
  return <HomeMuseumShowcase bundle={demoBundle} />;
}
