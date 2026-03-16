import { demoBundle } from "@/data/demo/projects";
import { HomeMuseumShowcase } from "@/features/museum/HomeMuseumShowcase";

export function MuseumDemo() {
  return <HomeMuseumShowcase bundle={demoBundle} />;
}
