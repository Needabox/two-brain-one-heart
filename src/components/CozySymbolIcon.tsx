import { COZY_SYMBOL_CATALOG } from '../game-engine/puzzles';
import type { CozySymbolId } from '../game-engine/types';

interface CozySymbolIconProps {
  symbol: CozySymbolId;
  size?: number;
  className?: string;
}

export function CozySymbolIcon({ symbol, size = 28, className = '' }: CozySymbolIconProps) {
  const renderPath = () => {
    switch (symbol) {
      case 'star':
        return (
          <path
            d="M16 3l3.9 7.9 8.7 1.3-6.3 6.1 1.5 8.7L16 22.9 8.2 27l1.5-8.7-6.3-6.1 8.7-1.3L16 3z"
            fill="#FFD452"
            stroke="#4A355A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        );
      case 'heart':
        return (
          <path
            d="M16 27S5 19.8 5 11.8C5 7.9 8 5 11.7 5c2.2 0 3.6 1 4.3 2.5C16.7 6 18.1 5 20.3 5 24 5 27 7.9 27 11.8 27 19.8 16 27 16 27z"
            fill="#FF7CA3"
            stroke="#4A355A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        );
      case 'moon':
        return (
          <path
            d="M21.5 23.5A9.5 9.5 0 0 1 11 7.2 9.8 9.8 0 1 0 25 20.8a8.5 8.5 0 0 1-3.5 2.7z"
            fill="#B79EFF"
            stroke="#4A355A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        );
      case 'leaf':
        return (
          <g>
            <path
              d="M7 24C7 13 14 6 25 6c0 11-7 18-18 18z"
              fill="#72DFB2"
              stroke="#4A355A"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M8 23l11-11" stroke="#4A355A" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 'cloud':
        return (
          <path
            d="M9 23h14a5 5 0 0 0 .8-9.9A6.5 6.5 0 0 0 11 11.8 4.8 4.8 0 0 0 9 23z"
            fill="#89C9FF"
            stroke="#4A355A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        );
      case 'key':
        return (
          <g>
            <circle cx="11" cy="16" r="5.5" fill="#FFB36B" stroke="#4A355A" strokeWidth="2.2" />
            <circle cx="11" cy="16" r="2" fill="#FFFDF9" />
            <path
              d="M16.5 16H27v4h-3.5v-2h-2.5v2H19v-4"
              fill="#FFB36B"
              stroke="#4A355A"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>
        );
      case 'sun':
        return (
          <g>
            <circle cx="16" cy="16" r="6" fill="#FFD35C" stroke="#4A355A" strokeWidth="2.2" />
            <path
              d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2.2 2.2M22.3 22.3l2.2 2.2M24.5 7.5l-2.2 2.2M9.7 22.3l-2.2 2.2"
              stroke="#4A355A"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        );
      case 'bell':
        return (
          <g>
            <path
              d="M16 5a7 7 0 0 0-7 7v5l-2.5 3.5h19L23 17v-5a7 7 0 0 0-7-7z"
              fill="#E5A8FF"
              stroke="#4A355A"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="24.5" r="2.5" fill="#FFD452" stroke="#4A355A" strokeWidth="1.8" />
          </g>
        );
      case 'gem':
        return (
          <polygon
            points="16,4 27,13 16,28 5,13"
            fill="#7AE2FF"
            stroke="#4A355A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        );
      case 'flower':
        return (
          <g>
            <circle cx="16" cy="9" r="4" fill="#FFA4C4" stroke="#4A355A" strokeWidth="1.8" />
            <circle cx="22.5" cy="14" r="4" fill="#FFA4C4" stroke="#4A355A" strokeWidth="1.8" />
            <circle cx="20" cy="21.5" r="4" fill="#FFA4C4" stroke="#4A355A" strokeWidth="1.8" />
            <circle cx="12" cy="21.5" r="4" fill="#FFA4C4" stroke="#4A355A" strokeWidth="1.8" />
            <circle cx="9.5" cy="14" r="4" fill="#FFA4C4" stroke="#4A355A" strokeWidth="1.8" />
            <circle cx="16" cy="16" r="4" fill="#FFD452" stroke="#4A355A" strokeWidth="1.8" />
          </g>
        );
      case 'mug':
        return (
          <g>
            <rect
              x="7"
              y="11"
              width="14"
              height="14"
              rx="4"
              fill="#FFB396"
              stroke="#4A355A"
              strokeWidth="2.2"
            />
            <path
              d="M21 14h3a3 3 0 0 1 0 6h-3"
              stroke="#4A355A"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path d="M11 7c0-1.5 1.5-2 1.5-3M16 7c0-1.5 1.5-2 1.5-3" stroke="#4A355A" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 'spark':
        return (
          <path
            d="M16 3l3.2 9.8L29 16l-9.8 3.2L16 29l-3.2-9.8L3 16l9.8-3.2L16 3z"
            fill="#C7B6FF"
            stroke="#4A355A"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        );
    }
  };

  const meta = COZY_SYMBOL_CATALOG[symbol];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label={meta.label}
      className={className}
    >
      {renderPath()}
    </svg>
  );
}
