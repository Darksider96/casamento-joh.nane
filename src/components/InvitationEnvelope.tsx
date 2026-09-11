import React, { useEffect, useState } from 'react';
import { Heart, Music2 } from 'lucide-react';

export const InvitationEnvelope: React.FC = () => {
  const [isOpening, setIsOpening] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMusicReady, setIsMusicReady] = useState(
    () => typeof window !== 'undefined' && Boolean((window as any).__weddingMusicReady),
  );

  useEffect(() => {
    if (!isVisible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleMusicReady = () => setIsMusicReady(true);
    window.addEventListener('wedding_music_ready', handleMusicReady);
    const fallbackTimer = window.setTimeout(() => setIsMusicReady(true), 2500);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener('wedding_music_ready', handleMusicReady);
    };
  }, [isVisible]);

  const handleOpenInvitation = () => {
    if (isOpening || !isMusicReady) return;

    window.dispatchEvent(new CustomEvent('wedding_invitation_opened'));
    setIsOpening(true);
    window.setTimeout(() => setIsVisible(false), 1350);
  };

  if (!isVisible) return null;

  return (
    <div className={`invitation-intro ${isOpening ? 'is-opening' : ''}`}>
      <div className="invitation-grain" aria-hidden="true" />
      <div className="invitation-heading" aria-hidden="true">
        <span>Johnatan</span>
        <Heart className="invitation-heading-heart" />
        <span>Regiane</span>
      </div>

      <button
        type="button"
        className="envelope-button"
        onClick={handleOpenInvitation}
        disabled={!isMusicReady || isOpening}
        aria-label="Abrir o convite de casamento com música"
      >
        <span className="envelope-shadow" aria-hidden="true" />
        <span className="envelope">
          <span className="envelope-back" />
          <span className="envelope-letter">
            <span className="envelope-letter-small">Um convite especial</span>
            <span className="envelope-letter-names">Johnatan & Regiane</span>
            <span className="envelope-letter-date">25 • 09 • 2026</span>
          </span>
          <span className="envelope-flap" />
          <span className="envelope-front" />
          <span className="envelope-message">
            Para você
            <small>com muito carinho</small>
          </span>
          <span className="envelope-seal">
            <Heart />
          </span>
        </span>
      </button>

      <p className="invitation-hint">
        {isMusicReady ? (
          <>
            <Music2 /> Toque para abrir o convite com música
          </>
        ) : (
          'Preparando seu convite...'
        )}
      </p>
    </div>
  );
};
