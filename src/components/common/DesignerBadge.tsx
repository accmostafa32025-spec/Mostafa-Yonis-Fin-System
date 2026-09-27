import React from 'react';

export const DesignerBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`inline-flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl bg-transparent transition-all select-none group ${className}`}
      dir="ltr"
    >
      <span className="text-[11px] font-semibold tracking-wider text-slate-400 font-sans uppercase">
        Designed By
      </span>

      {/* Isolated Signature Logo: Perfectly blends into page background */}
      <div className="flex items-center gap-2 hover:scale-[1.02] transition-transform duration-300">
        <svg
          viewBox="0 0 460 120"
          className="h-7 w-auto max-w-[210px] sm:max-w-[240px] drop-shadow-[0_2px_10px_rgba(217,165,32,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rich 3D Warm Gold Gradients */}
            <linearGradient id="goldTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="25%" stopColor="#F5D061" />
              <stop offset="60%" stopColor="#D49E24" />
              <stop offset="90%" stopColor="#996C0E" />
              <stop offset="100%" stopColor="#6E4A05" />
            </linearGradient>

            <linearGradient id="goldBevel" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFEAA7" />
              <stop offset="40%" stopColor="#E5B539" />
              <stop offset="75%" stopColor="#B37D14" />
              <stop offset="100%" stopColor="#7A5208" />
            </linearGradient>

            <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFEFB8" />
              <stop offset="50%" stopColor="#E5B539" />
              <stop offset="100%" stopColor="#9E6E12" />
            </linearGradient>

            {/* Deep Midnight Navy Facets */}
            <linearGradient id="navyCore" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1B38" />
              <stop offset="50%" stopColor="#051024" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* Vibrant Electric Cyan Neon Stripe */}
            <linearGradient id="cyanNeon" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>

          {/* ========================================================= */}
          {/* 3D Geometric "M" Monogram with Wings & Cyan Accent       */}
          {/* ========================================================= */}
          <g transform="translate(10, 8)">
            {/* Left Pillar Outer Golden Bevel */}
            <polygon
              points="10,24 38,36 38,105 10,93"
              fill="url(#goldTop)"
            />
            {/* Left Pillar Inner Deep Navy Facet */}
            <polygon
              points="16,32 32,38 32,98 16,90"
              fill="url(#navyCore)"
            />

            {/* Left Diagonal Chevron - Gold */}
            <polygon
              points="38,36 82,82 72,90 28,45"
              fill="url(#goldBevel)"
            />

            {/* Center Peak - Navy with Cyan Neon Highlight */}
            <polygon
              points="82,82 128,32 116,28 72,75"
              fill="url(#navyCore)"
            />
            {/* Neon Cyan Accent Line */}
            <polygon
              points="118,30 123,32 84,76 80,74"
              fill="url(#cyanNeon)"
            />

            {/* Right Upward Golden Wing / Checkmark Arrow */}
            <polygon
              points="128,32 165,8 135,55 116,46"
              fill="url(#goldTop)"
            />

            {/* Right Pillar Bottom Segment */}
            <polygon
              points="135,55 135,105 118,97 118,48"
              fill="url(#goldBevel)"
            />
            {/* Right Pillar Navy Facet */}
            <polygon
              points="130,58 130,100 123,95 123,54"
              fill="url(#navyCore)"
            />
          </g>

          {/* ========================================================= */}
          {/* Cursive Calligraphy "Mostafa Yonis" in Embossed Gold      */}
          {/* ========================================================= */}
          <g transform="translate(185, 78)">
            {/* Subtle Gold Ambient Glow */}
            <text
              x="0"
              y="0"
              fontFamily="'Playfair Display', 'Brush Script MT', 'Great Vibes', 'Alex Brush', cursive, serif"
              fontSize="48"
              fontStyle="italic"
              fontWeight="bold"
              fill="none"
              stroke="#D49E24"
              strokeWidth="3"
              strokeOpacity="0.4"
              letterSpacing="1"
            >
              Mostafa Yonis
            </text>

            {/* Main Golden Calligraphy Text with Rich Gradient */}
            <text
              x="0"
              y="0"
              fontFamily="'Playfair Display', 'Brush Script MT', 'Great Vibes', 'Alex Brush', cursive, serif"
              fontSize="48"
              fontStyle="italic"
              fontWeight="bold"
              fill="url(#goldTop)"
              stroke="url(#goldBevel)"
              strokeWidth="0.8"
              letterSpacing="1"
            >
              Mostafa Yonis
            </text>

            {/* Flowing Golden Underline Flourish Tail from Y */}
            <path
              d="M -15,10 Q 50,28 130,24 T 240,14"
              fill="none"
              stroke="url(#goldTop)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
