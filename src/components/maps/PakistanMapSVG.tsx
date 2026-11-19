// SVG outline paths for Pakistan and major cities
// Simplified outlines for visual representation

export const PakistanOutline = () => (
  <g>
    {/* Pakistan border outline */}
    <path
      d="M 150 50 L 200 30 L 280 40 L 350 70 L 400 100 L 450 90 L 500 120 L 520 180 L 540 220 L 560 280 L 580 350 L 600 400 L 650 420 L 700 450 L 680 480 L 620 470 L 550 440 L 480 420 L 400 380 L 320 350 L 250 320 L 180 280 L 150 230 L 120 180 L 100 130 L 120 80 Z"
      fill="hsl(var(--primary)/0.05)"
      stroke="hsl(var(--primary))"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Inner decorative border */}
    <path
      d="M 150 50 L 200 30 L 280 40 L 350 70 L 400 100 L 450 90 L 500 120 L 520 180 L 540 220 L 560 280 L 580 350 L 600 400 L 650 420 L 700 450 L 680 480 L 620 470 L 550 440 L 480 420 L 400 380 L 320 350 L 250 320 L 180 280 L 150 230 L 120 180 L 100 130 L 120 80 Z"
      fill="none"
      stroke="hsl(var(--primary)/0.3)"
      strokeWidth="1"
      strokeDasharray="8 4"
    />
    {/* Title */}
    <text x="400" y="30" textAnchor="middle" className="text-lg font-bold fill-primary">
      🇵🇰 PAKISTAN
    </text>
  </g>
);

export const KarachiOutline = () => (
  <g>
    <path
      d="M 50 300 L 80 250 L 120 220 L 180 200 L 250 180 L 320 150 L 400 130 L 480 140 L 550 180 L 580 230 L 600 290 L 580 350 L 520 380 L 450 390 L 380 380 L 300 360 L 220 330 L 150 310 L 80 320 Z"
      fill="hsl(var(--secondary)/0.05)"
      stroke="hsl(var(--secondary))"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <text x="350" y="408" textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
      KARACHI
    </text>
  </g>
);

export const LahoreOutline = () => (
  <g>
    <path
      d="M 80 80 L 150 50 L 250 40 L 350 60 L 450 100 L 520 160 L 560 250 L 530 340 L 450 380 L 350 390 L 250 370 L 150 320 L 100 250 L 70 180 L 60 120 Z"
      fill="hsl(var(--secondary)/0.05)"
      stroke="hsl(var(--secondary))"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <text x="320" y="420" textAnchor="middle" className="text-sm font-semibold fill-secondary">
      LAHORE
    </text>
  </g>
);

export const IslamabadOutline = () => (
  <g>
    {/* Margalla Hills representation */}
    <path
      d="M 100 70 L 200 40 L 350 30 L 500 40 L 620 70"
      fill="none"
      stroke="hsl(var(--muted-foreground)/0.3)"
      strokeWidth="8"
      strokeLinecap="round"
    />
    <path
      d="M 100 120 L 200 80 L 350 70 L 500 90 L 620 130 L 650 200 L 640 300 L 580 380 L 480 420 L 350 430 L 220 400 L 120 340 L 80 260 L 70 180 Z"
      fill="hsl(var(--secondary)/0.05)"
      stroke="hsl(var(--secondary))"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <text x="350" y="460" textAnchor="middle" className="text-sm font-semibold fill-secondary">
      ISLAMABAD
    </text>
  </g>
);

export const PeshawarOutline = () => (
  <g>
    <path
      d="M 100 100 L 180 70 L 300 60 L 420 90 L 520 150 L 560 240 L 530 330 L 450 380 L 320 400 L 180 370 L 100 300 L 70 200 Z"
      fill="hsl(var(--secondary)/0.05)"
      stroke="hsl(var(--secondary))"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <text x="320" y="430" textAnchor="middle" className="text-sm font-semibold fill-secondary">
      PESHAWAR
    </text>
  </g>
);

export const QuettaOutline = () => (
  <g>
    <path
      d="M 120 100 L 200 60 L 320 70 L 450 120 L 530 200 L 540 300 L 480 380 L 360 420 L 220 400 L 120 330 L 80 240 L 90 150 Z"
      fill="hsl(var(--secondary)/0.05)"
      stroke="hsl(var(--secondary))"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <text x="320" y="450" textAnchor="middle" className="text-sm font-semibold fill-secondary">
      QUETTA
    </text>
  </g>
);

// City markers for Pakistan map showing major cities
export const PakistanCityMarkers = () => (
  <>
    {/* Karachi region */}
    <circle cx="680" cy="420" r="25" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary)/0.5)" strokeWidth="2" />
    {/* Lahore region */}
    <circle cx="480" cy="200" r="20" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary)/0.5)" strokeWidth="2" />
    {/* Islamabad region */}
    <circle cx="420" cy="120" r="18" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary)/0.5)" strokeWidth="2" />
    {/* Quetta region */}
    <circle cx="180" cy="280" r="16" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary)/0.5)" strokeWidth="2" />
    {/* Peshawar region */}
    <circle cx="300" cy="80" r="16" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary)/0.5)" strokeWidth="2" />
  </>
);

export type MapType = 'pakistan' | 'karachi' | 'lahore' | 'islamabad' | 'peshawar' | 'quetta' | 'faisalabad' | 'multan' | 'rawalpindi' | null;
