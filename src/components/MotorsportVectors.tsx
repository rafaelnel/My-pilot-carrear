import React from 'react';
import { MotorsportCategory } from '../types';

interface HelmetVectorProps {
  primaryColor: string;
  secondaryColor?: string;
  className?: string;
}

export function HelmetVector({
  primaryColor,
  secondaryColor = '#1e3a8a',
  className = 'w-16 h-16'
}: HelmetVectorProps) {
  return (
    <svg
      viewBox="0 0 260 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Subtle drop shadow */}
      <ellipse cx="145" cy="195" rx="72" ry="30" fill="#000000" fillOpacity="0.35" />

      {/* Main Helmet Shell (Base Primary Color) */}
      <path
        d="M42 150 C36 122, 46 72, 92 48 C134 26, 192 34, 218 72 C240 104, 240 150, 224 180 C216 194, 195 198, 165 202 L58 214 C44 215, 34 204, 34 190 L42 150 Z"
        fill={primaryColor}
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Top/Back Aerodynamic Spoiler */}
      <path
        d="M182 48 L224 56 C230 58, 232 66, 226 76 L210 105 C202 92, 192 68, 182 48 Z"
        fill={primaryColor}
        stroke="#0f172a"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Secondary Color Racing Stripes (Top to Chin & Side Swooshes) */}
      <path
        d="M84 52 C115 36, 154 36, 176 46 C148 68, 124 98, 114 134 L74 128 C74 96, 76 70, 84 52 Z"
        fill={secondaryColor}
        stroke="#0f172a"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      <path
        d="M232 108 C205 118, 182 135, 162 162 C136 188, 98 196, 68 202 L148 204 C188 200, 216 192, 226 176 C235 156, 236 130, 232 108 Z"
        fill={secondaryColor}
        stroke="#0f172a"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Crisp White Accent Pinstripes */}
      <path
        d="M114 42 C100 66, 94 94, 92 122"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M170 46 C142 70, 124 100, 116 132"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M228 106 C198 118, 174 138, 152 166 C128 190, 95 196, 65 200"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Chin Guard Sculpting & Air Vent */}
      <path
        d="M35 162 L78 156 C86 155, 88 164, 80 168 L36 176 Z"
        fill={primaryColor}
        stroke="#0f172a"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M38 148 L64 145 L62 154 L36 157 Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Bottom Rubber Neck Trim */}
      <path
        d="M44 208 L212 188 C216 194, 210 200, 198 202 L54 218 C44 218, 40 213, 44 208 Z"
        fill="#1e293b"
        stroke="#0f172a"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Visor Dark Shield & Pivot Mechanism */}
      <path
        d="M42 96 L142 98 C160 99, 168 114, 156 128 L128 156 C118 165, 102 166, 88 160 L36 144 L42 96 Z"
        fill="#090d16"
        stroke="#0f172a"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* Visor Mechanical Side Plate */}
      <path
        d="M112 98 L144 98 C160 99, 168 114, 156 128 L128 156 C120 162, 108 162, 100 156 L112 98 Z"
        fill="#334155"
        stroke="#0f172a"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <circle cx="144" cy="114" r="7" fill="#1e293b" stroke="#0f172a" strokeWidth="3.5" />
      <circle cx="125" cy="118" r="5" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
      <circle cx="114" cy="144" r="4.5" fill="#0f172a" />

      {/* Visor Blue/Cyan Glossy Reflections */}
      <path d="M52 100 L64 100 L58 142 L46 139 Z" fill="#38bdf8" fillOpacity="0.65" />
      <path d="M70 100 L77 100 L71 145 L64 143 Z" fill="#38bdf8" fillOpacity="0.45" />

      {/* Helmet Crown Highlights */}
      <path
        d="M72 72 C85 58, 105 50, 122 46"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <circle cx="195" cy="166" r="9" fill="#334155" stroke="#0f172a" strokeWidth="4" />
      <circle cx="195" cy="166" r="4" fill="#94a3b8" />
    </svg>
  );
}

interface CarVectorProps {
  category: MotorsportCategory;
  teamColor: string;
  secondaryColor?: string;
  helmetColor?: string;
  className?: string;
}

export function CategoryCarVector({
  category,
  teamColor,
  secondaryColor = '#ffffff',
  helmetColor = '#facc15',
  className = 'w-full h-40'
}: CarVectorProps) {
  if (category === 'kart') {
    return (
      <svg viewBox="0 0 500 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Drop shadow */}
        <rect x="115" y="34" width="285" height="162" rx="32" fill="#000000" fillOpacity="0.35" />

        {/* Rear Bumper */}
        <path d="M110 42 L126 42 L126 178 L110 178 C102 178, 98 168, 98 155 L98 65 C98 52, 102 42, 110 42 Z" fill="#334155" stroke="#0f172a" strokeWidth="5" />

        {/* Rear Tires */}
        <rect x="132" y="20" width="52" height="36" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <rect x="132" y="164" width="52" height="36" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />

        {/* Front Tires */}
        <rect x="296" y="28" width="44" height="30" rx="7" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <rect x="296" y="162" width="44" height="30" rx="7" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />

        {/* Kart Tubular Frame & Floorpan */}
        <path d="M126 62 L345 62 L370 85 L370 135 L345 158 L126 158 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <path d="M140 72 L330 72 M140 148 L330 148" stroke={teamColor} strokeWidth="6" strokeLinecap="round" />

        {/* Sidepods (Team Color) */}
        <path d="M192 26 L282 30 C292 32, 294 48, 284 58 L192 58 C184 58, 182 26, 192 26 Z" fill={teamColor} stroke="#0f172a" strokeWidth="5" />
        <path d="M192 194 L282 190 C292 188, 294 172, 284 162 L192 162 C184 162, 182 194, 192 194 Z" fill={teamColor} stroke="#0f172a" strokeWidth="5" />
        {/* Sidepod Accents */}
        <path d="M204 35 L270 38" stroke={secondaryColor} strokeWidth="5" strokeLinecap="round" />
        <path d="M204 185 L270 182" stroke={secondaryColor} strokeWidth="5" strokeLinecap="round" />

        {/* Front Fairing & Nose Cone */}
        <path d="M342 46 C378 52, 398 78, 398 110 C398 142, 378 168, 342 174 L332 152 L356 132 L356 88 L332 68 Z" fill={teamColor} stroke="#0f172a" strokeWidth="5" />
        {/* Nassau Panel (Number Plate) */}
        <path d="M286 92 L366 96 C376 98, 376 122, 366 124 L286 128 Z" fill={teamColor} stroke="#0f172a" strokeWidth="5" />
        <path d="M300 100 L345 103 L345 117 L300 120 Z" fill="#facc15" />

        {/* 2-Stroke Engine & Exhaust (Right Rear) */}
        <rect x="144" y="122" width="46" height="32" rx="5" fill="#94a3b8" stroke="#0f172a" strokeWidth="4.5" />
        <rect x="152" y="128" width="20" height="20" rx="3" fill="#ef4444" stroke="#0f172a" strokeWidth="3" />
        <rect x="122" y="75" width="22" height="58" rx="9" fill="#64748b" stroke="#0f172a" strokeWidth="4.5" />

        {/* Bucket Seat & Steering Wheel */}
        <path d="M185 74 C215 74, 240 82, 240 110 C240 138, 215 146, 185 146 C172 146, 166 132, 166 110 C166 88, 172 74, 185 74 Z" fill="#0f172a" stroke="#334155" strokeWidth="4" />
        <circle cx="272" cy="110" r="16" stroke="#0f172a" strokeWidth="6" fill="none" />
        {/* Driver Helmet Top View */}
        <circle cx="212" cy="110" r="18" fill={helmetColor} stroke="#0f172a" strokeWidth="4.5" />
        <path d="M222 98 C230 104, 230 116, 222 122" stroke="#090d16" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  if (category === 'f3') {
    return (
      <svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Shadow */}
        <path d="M75 50 L485 50 L495 182 L75 182 Z" fill="#000000" fillOpacity="0.3" />

        {/* Front Wing (Left) */}
        <path d="M72 42 L106 42 L106 178 L72 178 L66 164 L66 56 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <rect x="74" y="45" width="24" height="24" fill={teamColor} stroke="#0f172a" strokeWidth="3.5" />
        <rect x="74" y="151" width="24" height="24" fill={teamColor} stroke="#0f172a" strokeWidth="3.5" />

        {/* Suspension Arms */}
        <path d="M148 45 L188 88 M168 45 L198 88 M148 175 L188 132 M168 175 L198 132" stroke="#0f172a" strokeWidth="5" />
        <path d="M385 45 L355 85 M405 45 L375 85 M385 175 L355 135 M405 175 L375 135" stroke="#0f172a" strokeWidth="5" />

        {/* Wheels */}
        <rect x="128" y="18" width="58" height="36" rx="9" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <rect x="128" y="166" width="58" height="36" rx="9" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <rect x="372" y="16" width="66" height="42" rx="10" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <rect x="372" y="162" width="66" height="42" rx="10" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />

        {/* Floor / Underbody */}
        <path d="M210 52 L365 56 L365 164 L210 168 Z" fill="#0f172a" />

        {/* Main F3 Bodywork & Sidepods (Pointing Left like reference) */}
        <path
          d="M55 110 C55 96, 120 90, 195 86 L225 56 C255 48, 315 54, 365 76 L435 88 L435 132 L365 144 C315 166, 255 172, 225 164 L195 134 C120 130, 55 124, 55 110 Z"
          fill={teamColor}
          stroke="#0f172a"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />

        {/* White / Secondary Livery Sweep */}
        <path
          d="M150 96 C205 92, 240 66, 295 66 C265 82, 260 95, 340 98 L340 122 C260 125, 265 138, 295 154 C240 154, 205 128, 150 124 Z"
          fill={secondaryColor}
        />

        {/* Cockpit & Halo */}
        <rect x="235" y="88" width="68" height="44" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="4" />
        {/* Driver Helmet */}
        <circle cx="268" cy="110" r="14" fill={helmetColor} stroke="#0f172a" strokeWidth="3.5" />
        {/* Halo Titanium Bar */}
        <path d="M218 110 L248 110 M245 110 C245 86, 288 86, 295 94 M245 110 C245 134, 288 134, 295 126" stroke="#e2e8f0" strokeWidth="5.5" strokeLinecap="round" />

        {/* Rear Wing (Right) */}
        <path d="M438 56 L478 56 L478 164 L438 164 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <rect x="446" y="62" width="24" height="96" fill={secondaryColor} stroke="#0f172a" strokeWidth="3.5" />
        <rect x="436" y="52" width="44" height="10" fill={teamColor} stroke="#0f172a" strokeWidth="3.5" />
        <rect x="436" y="158" width="44" height="10" fill={teamColor} stroke="#0f172a" strokeWidth="3.5" />
      </svg>
    );
  }

  if (category === 'f2') {
    return (
      <svg viewBox="0 0 600 230" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Shadow */}
        <path d="M55 42 L530 42 L542 194 L55 194 Z" fill="#000000" fillOpacity="0.35" />

        {/* Sculpted Multi-Element Front Wing (Left) */}
        <path d="M48 34 L96 42 L86 115 L96 188 L48 196 L38 115 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="5" />
        <path d="M56 38 L86 44 L80 82 L52 78 Z" fill="#f97316" stroke="#0f172a" strokeWidth="3.5" />
        <path d="M56 192 L86 186 L80 148 L52 152 Z" fill="#f97316" stroke="#0f172a" strokeWidth="3.5" />

        {/* Suspension Wishbones */}
        <path d="M135 48 L185 92 M162 48 L198 92 M135 182 L185 138 M162 182 L198 138" stroke="#0f172a" strokeWidth="5.5" />
        <path d="M425 46 L392 90 M450 46 L412 90 M425 184 L392 140 M450 184 L412 140" stroke="#0f172a" strokeWidth="5.5" />

        {/* F2 Wide Tires */}
        <rect x="118" y="14" width="66" height="40" rx="10" fill="#1e293b" stroke="#0f172a" strokeWidth="5.5" />
        <rect x="118" y="176" width="66" height="40" rx="10" fill="#1e293b" stroke="#0f172a" strokeWidth="5.5" />
        <rect x="410" y="12" width="76" height="46" rx="11" fill="#1e293b" stroke="#0f172a" strokeWidth="5.5" />
        <rect x="410" y="172" width="76" height="46" rx="11" fill="#1e293b" stroke="#0f172a" strokeWidth="5.5" />

        {/* Carbon Floor & Venturi Tunnels */}
        <path d="M216 44 L404 50 L414 180 L216 186 Z" fill="#0f172a" stroke="#334155" strokeWidth="3" />

        {/* F2 Aerodynamic Body & Coke-Bottle Sidepods */}
        <path
          d="M28 115 C28 98, 110 92, 205 88 L230 52 C275 44, 345 52, 396 80 L478 94 L478 136 L396 150 C345 178, 275 186, 230 178 L205 142 C110 138, 28 132, 28 115 Z"
          fill={teamColor}
          stroke="#0f172a"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />

        {/* Nose Tip & Engine Cover Contrasting Accents */}
        <path d="M28 115 C28 103, 55 99, 76 97 L76 133 C55 131, 28 127, 28 115 Z" fill="#f97316" />
        <path d="M245 56 L365 72 L395 92 L320 76 Z" fill="#f97316" />
        <path d="M245 174 L365 158 L395 138 L320 154 Z" fill="#f97316" />

        {/* Sidepod Cooling Louvers */}
        <path d="M275 72 L270 82 M288 74 L283 84 M301 76 L296 86" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        <path d="M275 158 L270 148 M288 156 L283 146 M301 154 L296 144" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

        {/* Cockpit, Driver & Halo */}
        <rect x="242" y="90" width="76" height="50" rx="18" fill="#0f172a" />
        <circle cx="282" cy="115" r="15" fill={helmetColor} stroke="#0f172a" strokeWidth="4" />
        <path d="M222 115 L256 115 M254 115 C254 86, 304 86, 314 96 M254 115 C254 144, 304 144, 314 134" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />

        {/* Rear Wing Assembly (Right) */}
        <path d="M482 54 L528 50 L528 180 L482 176 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="5.5" />
        <rect x="494" y="56" width="22" height="118" fill="#f97316" stroke="#0f172a" strokeWidth="3.5" />
      </svg>
    );
  }

  // F1 Flagship Car (Full length, aggressive multi-plane aero, shark fin, bargeboards)
  return (
    <svg viewBox="0 0 650 245" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Ground Shadow */}
      <path d="M45 36 L585 36 L600 212 L45 212 Z" fill="#000000" fillOpacity="0.4" />

      {/* Multi-element F1 Front Wing (Left) */}
      <path d="M36 22 L98 30 L84 122 L98 214 L36 222 L20 122 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="5.5" />
      <path d="M44 28 L88 34 L82 86 L38 82 Z" fill={teamColor} stroke="#0f172a" strokeWidth="3.5" />
      <path d="M44 216 L88 210 L82 158 L38 162 Z" fill={teamColor} stroke="#0f172a" strokeWidth="3.5" />
      <path d="M58 30 L52 84 M72 32 L66 85 M58 214 L52 160 M72 212 L66 159" stroke="#0f172a" strokeWidth="3.5" />

      {/* Carbon Suspension & Pull-rods */}
      <path d="M138 52 L196 98 M168 52 L212 98 M138 192 L196 146 M168 192 L212 146" stroke="#0f172a" strokeWidth="6" />
      <path d="M465 50 L422 96 M495 50 L446 96 M465 194 L422 148 M495 194 L446 148" stroke="#0f172a" strokeWidth="6" />

      {/* 18-inch Pirelli F1 Tires */}
      <rect x="118" y="12" width="74" height="44" rx="11" fill="#1e293b" stroke="#0f172a" strokeWidth="6" />
      <rect x="118" y="188" width="74" height="44" rx="11" fill="#1e293b" stroke="#0f172a" strokeWidth="6" />
      <rect x="448" y="10" width="84" height="50" rx="12" fill="#1e293b" stroke="#0f172a" strokeWidth="6" />
      <rect x="448" y="184" width="84" height="50" rx="12" fill="#1e293b" stroke="#0f172a" strokeWidth="6" />

      {/* Massive Carbon Ground-Effect Floor & Side Strakes */}
      <path d="M228 36 L440 44 L452 200 L228 208 Z" fill="#111827" stroke="#0f172a" strokeWidth="5" />
      <path d="M236 44 L290 44 L282 200 L236 200 Z" fill={teamColor} fillOpacity="0.8" />

      {/* F1 Sculpted Monocoque, Sidepods & Engine Cover */}
      <path
        d="M24 122 C24 106, 118 100, 224 94 L256 46 C312 40, 384 52, 438 86 L532 102 L532 142 L438 158 C384 192, 312 204, 256 198 L224 150 C118 144, 24 138, 24 122 Z"
        fill={teamColor}
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Nose Cone Racing Stripes & Number Badge */}
      <rect x="180" y="96" width="8" height="52" fill={secondaryColor} />
      <rect x="112" y="108" width="22" height="28" rx="4" fill="#facc15" stroke="#0f172a" strokeWidth="3" />
      <path d="M65 112 L65 132 M80 112 L80 132 M95 112 L95 132" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />

      {/* Engine Cover White / Secondary Livery Graphics & Shark Fin */}
      <path d="M355 96 L455 82 L438 112 Z" fill={secondaryColor} />
      <path d="M355 148 L455 162 L438 132 Z" fill={secondaryColor} />
      <line x1="348" y1="122" x2="532" y2="122" stroke="#0f172a" strokeWidth="6" />

      {/* Sidepod Cooling Gills */}
      <path d="M300 72 L294 84 M314 74 L308 86 M328 76 L322 88" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M300 172 L294 160 M314 170 L308 158 M328 168 L322 156" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />

      {/* Cockpit Opening, T-Cam, Driver Helmet & Halo */}
      <rect x="262" y="95" width="84" height="54" rx="20" fill="#090d16" stroke="#0f172a" strokeWidth="4" />
      <circle cx="305" cy="122" r="16" fill={helmetColor} stroke="#0f172a" strokeWidth="4" />
      {/* Halo Titanium Protection */}
      <path d="M238 122 L276 122 M272 122 C272 90, 326 90, 338 102 M272 122 C272 154, 326 154, 338 142" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
      <path d="M272 122 C272 92, 324 92, 336 103 M272 122 C272 152, 324 152, 336 141" stroke={teamColor} strokeWidth="3.5" strokeLinecap="round" />

      {/* DRS Rear Wing (Right) */}
      <path d="M536 44 L592 38 L592 206 L536 200 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="6" />
      <rect x="550" y="48" width="26" height="148" fill="#0f172a" />
      <path d="M532 38 L602 38 M532 206 L602 206" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

interface TrackMapVectorProps {
  svgPath: string;
  accentColor?: string;
  isRacing?: boolean;
  playerColor?: string;
  className?: string;
}

export function TrackMapVector({
  svgPath,
  accentColor = '#e10600',
  isRacing = false,
  playerColor = '#e10600',
  className = 'w-full h-36'
}: TrackMapVectorProps) {
  return (
    <svg viewBox="0 0 300 170" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Subtle asphalt outer glow/curbs */}
      <path
        d={svgPath}
        stroke="#1e293b"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Main tarmac line */}
      <path
        d={svgPath}
        stroke="#475569"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Racing line highlight */}
      <path
        id="circuit-racing-line"
        d={svgPath}
        stroke={accentColor}
        strokeWidth="2.5"
        strokeDasharray="6 4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.85"
      />

      {/* Live animated cars on track when racing */}
      {isRacing && (
        <>
          {/* Rival pack dots */}
          <circle r="4.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5">
            <animateMotion dur="5.2s" repeatCount="indefinite" path={svgPath} />
          </circle>
          <circle r="4.5" fill="#facc15" stroke="#0f172a" strokeWidth="1.5">
            <animateMotion dur="5.6s" begin="-1.4s" repeatCount="indefinite" path={svgPath} />
          </circle>
          <circle r="4.5" fill="#a855f7" stroke="#0f172a" strokeWidth="1.5">
            <animateMotion dur="6.0s" begin="-2.8s" repeatCount="indefinite" path={svgPath} />
          </circle>
          {/* Player dot */}
          <circle r="6" fill={playerColor} stroke="#ffffff" strokeWidth="2">
            <animateMotion dur="5.4s" begin="-0.7s" repeatCount="indefinite" path={svgPath} />
          </circle>
        </>
      )}
    </svg>
  );
}

