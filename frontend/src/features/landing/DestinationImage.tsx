import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

type DestinationImageProps = {
  name: string;
  icon?: LucideIcon;
  big?: boolean;
  imageUrl?: string;
};

export default function DestinationImage({ name, icon: Icon, big = false, imageUrl }: DestinationImageProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showFallback = imageFailed || !imageUrl;

  return (
    <div className={`dest-card-bg${imageUrl && !imageFailed ? ' dest-card-bg-loaded' : ''}`}>
      {imageUrl && !showFallback && (
        <img
          src={imageUrl}
          alt={`${name} furniture collection`}
          className="dest-card-img"
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImageFailed(true)}
        />
      )}

      {showFallback && Icon && (
        <div
          className="dest-card-fallback"
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'var(--cl-surface-alt, var(--cl-surface-2))',
          }}
        >
          <Icon size={big ? 64 : 48} color="rgba(255,255,255,0.2)" />
        </div>
      )}
    </div>
  );
}

