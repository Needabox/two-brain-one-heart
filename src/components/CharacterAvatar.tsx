import { COSMETIC_CATALOG } from '../game-engine/scoring';
import type { CharacterId, CosmeticId } from '../game-engine/types';
import { AssetImage } from './AssetImage';

interface CharacterAvatarProps {
  character: CharacterId;
  cosmetic?: CosmeticId;
  mood?: 'idle' | 'happy';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CharacterAvatarProps['size']>, string> = {
  sm: 'h-16 w-14',
  md: 'h-24 w-22',
  lg: 'h-32 w-28',
};

export function CharacterAvatar({
  character,
  cosmetic = 'none',
  mood = 'idle',
  size = 'md',
  className = '',
}: CharacterAvatarProps) {
  const baseSrc =
    character === 'boy'
      ? `/assets/characters/character-a-${mood}.svg`
      : `/assets/characters/character-b-${mood}.svg`;

  const cosmeticItem = COSMETIC_CATALOG.find((c) => c.id === cosmetic);
  const label = character === 'boy' ? 'Character A (Cozy Boy)' : 'Character B (Cozy Girl)';

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${SIZE_CLASSES[size]} ${className}`}>
      <AssetImage
        src={baseSrc}
        alt={label}
        className="h-full w-full object-contain drop-shadow-[0_4px_6px_rgba(74,53,90,0.16)]"
        fallback={<span className="text-xl font-bold">{character === 'boy' ? 'A' : 'B'}</span>}
      />
      {cosmeticItem?.assetPath && (
        <AssetImage
          src={cosmeticItem.assetPath}
          alt={`${cosmeticItem.label} accessory`}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          fallback={null}
        />
      )}
    </div>
  );
}
