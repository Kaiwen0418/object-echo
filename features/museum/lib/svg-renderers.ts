const CASIO_F91W_SVG = `
<svg viewBox="0 -20 300 440" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="casio-central-shadow" cx="50%" cy="52%" r="34%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.18" />
      <stop offset="58%" stop-color="#000000" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <filter id="casio-shadow-blur" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="12" />
    </filter>
  </defs>
  <ellipse cx="150" cy="200" rx="88" ry="106" fill="url(#casio-central-shadow)" filter="url(#casio-shadow-blur)" />
  <path d="M100,50 L100,0 L200,0 L200,50" fill="none" stroke="#333" stroke-width="2" />
  <path d="M110,10 L190,10 M110,20 L190,20 M110,30 L190,30 M110,40 L190,40" stroke="#222" stroke-width="1.5" />
  <path d="M80,100 L220,100 L250,150 L250,250 L220,300 L80,300 L50,250 L50,150 Z" fill="#151515" stroke="#444" stroke-width="3" />
  <path d="M90,115 L210,115 L235,155 L235,245 L210,285 L90,285 L65,245 L65,155 Z" fill="#080808" stroke="#0077ff" stroke-width="1.5" />
  <rect x="42" y="150" width="8" height="20" rx="2" fill="#333" stroke="#555" stroke-width="1" />
  <rect x="42" y="220" width="8" height="20" rx="2" fill="#333" stroke="#555" stroke-width="1" />
  <rect x="250" y="220" width="8" height="20" rx="2" fill="#333" stroke="#555" stroke-width="1" />
  <text x="150" y="135" fill="#f4f4f4" font-family="Arial, sans-serif" font-size="14" font-weight="900" letter-spacing="2" text-anchor="middle">CASIO</text>
  <text x="150" y="148" fill="#ffcc00" font-family="Arial, sans-serif" font-size="8" font-weight="700" letter-spacing="1" text-anchor="middle">F-91W</text>
  <text x="80" y="165" fill="#aaa" font-family="Arial, sans-serif" font-size="6" text-anchor="start">LIGHT</text>
  <text x="80" y="235" fill="#aaa" font-family="Arial, sans-serif" font-size="6" text-anchor="start">MODE</text>
  <text x="220" y="235" fill="#aaa" font-family="Arial, sans-serif" font-size="6" text-anchor="end">ALARM ON·OFF / 24HR</text>
  <text x="150" y="275" fill="#0077ff" font-family="Arial, sans-serif" font-size="9" font-weight="700" letter-spacing="1" text-anchor="middle">WATER RESIST</text>
  <rect x="85" y="170" width="130" height="55" rx="3" fill="#9fb8ad" stroke="#222" stroke-width="2" />
  <g transform="translate(95, 185)">
    <text x="0" y="10" fill="#223322" font-family="monospace" font-size="10" font-weight="700">SU</text>
    <text x="25" y="10" fill="#223322" font-family="monospace" font-size="10" font-weight="700">24</text>
    <text x="0" y="35" fill="#223322" font-family="monospace" font-size="28" font-weight="700" letter-spacing="-1">10:58</text>
    <text x="85" y="35" fill="#223322" font-family="monospace" font-size="14" font-weight="700">50</text>
    <text x="0" y="20" fill="#223322" font-family="Arial, sans-serif" font-size="5" font-weight="700">PM</text>
  </g>
  <path d="M100,350 L100,400 L200,400 L200,350" fill="none" stroke="#333" stroke-width="2" />
  <path d="M110,360 L190,360 M110,370 L190,370 M110,380 L190,380 M110,390 L190,390" stroke="#222" stroke-width="1.5" />
</svg>
`.trim();

export function getMuseumSvgMarkup(name: string) {
  if (name === "CASIO F-91W") return CASIO_F91W_SVG;
  return null;
}
