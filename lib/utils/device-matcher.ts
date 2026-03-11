import { demoDevices } from "@/data/demo/projects";
import type { DeviceMatchResponse, ProjectDevice } from "@/types";

function makeCandidate(device: ProjectDevice) {
  return {
    id: `candidate_${device.id}`,
    name: `${device.name} Reference Model`,
    viewerUrl: `https://sketchfab.com/mock/${device.id}`,
    embedUrl: `https://sketchfab.com/models/mock-${device.id}/embed`,
    thumbnailUrl: "https://placehold.co/640x360?text=Model+Preview",
    authorName: "Mock Archive",
    licenseLabel: "Demo License",
    downloadable: false
  };
}

export function matchDeviceSpecs(name: string, year: number): DeviceMatchResponse {
  const match =
    demoDevices.find((device) => device.name.toLowerCase().includes(name.toLowerCase())) ??
    demoDevices.reduce((closest, device) =>
      Math.abs(device.year - year) < Math.abs(closest.year - year) ? device : closest
    );

  return {
    era: match.era,
    specs: match.specs,
    candidateModels: [makeCandidate(match)]
  };
}
