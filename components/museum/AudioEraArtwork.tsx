import type { ProjectDevice } from "@/types";

type AudioEraArtworkProps = {
  device: ProjectDevice;
};

function CassetteRecorderArt() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <rect x="14" y="28" width="132" height="102" rx="12" fill="#cdb79a" stroke="#1a1a1a" strokeWidth="4" />
      <rect x="24" y="40" width="112" height="48" rx="6" fill="#f7f0e2" stroke="#1a1a1a" strokeWidth="4" />
      <circle cx="54" cy="64" r="15" fill="#1a1a1a" />
      <circle cx="106" cy="64" r="15" fill="#1a1a1a" />
      <circle cx="54" cy="64" r="5" fill="#f7f0e2" />
      <circle cx="106" cy="64" r="5" fill="#f7f0e2" />
      <rect x="18" y="52" width="8" height="24" rx="3" fill="#6a4b34" />
      <rect x="134" y="52" width="8" height="24" rx="3" fill="#6a4b34" />
      <rect x="42" y="100" width="76" height="8" rx="2" fill="#1a1a1a" />
      <rect x="34" y="114" width="92" height="6" rx="2" fill="#7b5940" />
      <rect x="48" y="18" width="64" height="18" rx="3" fill="#9b6c47" stroke="#1a1a1a" strokeWidth="4" />
      <circle cx="36" cy="110" r="6" fill="#1a1a1a" />
      <circle cx="124" cy="110" r="6" fill="#1a1a1a" />
    </svg>
  );
}

function Mp3PlayerArt() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <rect x="42" y="12" width="76" height="136" rx="16" fill="#edf0f5" stroke="#1a1a1a" strokeWidth="4" />
      <rect x="52" y="24" width="56" height="50" rx="6" fill="#d9f0ff" stroke="#1a1a1a" strokeWidth="4" />
      <rect x="60" y="34" width="40" height="6" rx="2" fill="#1a1a1a" />
      <rect x="60" y="46" width="28" height="6" rx="2" fill="#1a1a1a" opacity="0.7" />
      <rect x="60" y="58" width="20" height="4" rx="2" fill="#1a1a1a" opacity="0.4" />
      <circle cx="80" cy="106" r="26" fill="#ffffff" stroke="#1a1a1a" strokeWidth="4" />
      <circle cx="80" cy="106" r="8" fill="#1a1a1a" />
      <polygon points="78,90 78,104 90,97" fill="#1a1a1a" />
      <polygon points="70,104 78,110 78,118 68,110" fill="#1a1a1a" opacity="0.74" />
      <polygon points="92,104 100,110 90,118 90,110" fill="#1a1a1a" opacity="0.74" />
      <rect x="44" y="86" width="8" height="40" rx="4" fill="#c7ccd6" />
      <rect x="108" y="86" width="8" height="40" rx="4" fill="#c7ccd6" />
    </svg>
  );
}

function SmartphoneUiArt() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <rect x="34" y="10" width="92" height="140" rx="18" fill="#111111" />
      <rect x="42" y="22" width="76" height="116" rx="12" fill="#f7f8fb" />
      <rect x="60" y="16" width="40" height="6" rx="3" fill="#f7f8fb" opacity="0.7" />
      <rect x="50" y="32" width="60" height="62" rx="14" fill="#e4dcff" />
      <circle cx="80" cy="62" r="18" fill="#ffffff" opacity="0.72" />
      <polygon points="76,53 76,71 91,62" fill="#111111" />
      <rect x="54" y="102" width="52" height="8" rx="4" fill="#111111" />
      <rect x="54" y="116" width="38" height="6" rx="3" fill="#111111" opacity="0.58" />
      <rect x="54" y="128" width="18" height="4" rx="2" fill="#111111" opacity="0.28" />
      <rect x="98" y="126" width="8" height="8" rx="4" fill="#7c5cff" />
      <rect x="108" y="126" width="8" height="8" rx="4" fill="#111111" opacity="0.16" />
    </svg>
  );
}

export function AudioEraArtwork({ device }: AudioEraArtworkProps) {
  const year = device.year;
  const eraClass = year < 1990 ? "is-recorder" : year <= 2010 ? "is-mp3" : "is-phone";

  return (
    <div className={`cover-lg audio-era-artwork ${eraClass}`} aria-label={`${device.name} playback artwork`}>
      {year < 1990 ? <CassetteRecorderArt /> : year <= 2010 ? <Mp3PlayerArt /> : <SmartphoneUiArt />}
    </div>
  );
}
