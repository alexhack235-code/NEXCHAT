import React, { useEffect, useState } from 'react';

/**
 * Unique NEXCHAT Terminal Hash Typing Indicator
 * - Display: [Avatar] ### typing... with 3 terminal '#' hash symbols
 * - Styling: bg-[#202c33], rounded-full, 8px 12px padding, green #00a884 hashes
 * - Animation: Staggered hashBlink (0s, 0.2s, 0.4s) on 1.2s cycle
 * - Placement: Above input box on the left (ml-2 mb-1 w-fit), outside message list
 * - Auto-dismiss: 3000ms timeout
 * - Translate button: NEVER rendered for typing indicator
 */

export interface TypingIndicatorProps {
  name?: string;
  avatarUrl?: string;
  visible?: boolean;
  onAutoDismiss?: () => void;
  autoDismissMs?: number;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  name,
  avatarUrl = '/logo.jpg',
  visible = true,
  onAutoDismiss,
  autoDismissMs = 3000,
}) => {
  const [active, setActive] = useState(visible);

  useEffect(() => {
    setActive(visible);
    if (!visible) return;

    const timer = setTimeout(() => {
      setActive(false);
      if (onAutoDismiss) onAutoDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, onAutoDismiss]);

  if (!active) return null;

  const label = name ? `${name} typing...` : 'typing...';

  return (
    <div
      className="nex-typing-indicator ml-2 mb-1 w-fit inline-flex items-center gap-2 bg-[#202c33] px-3 py-2 rounded-full border border-white/5 shadow-md z-30 select-none"
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#202c33',
        padding: '8px 12px',
        borderRadius: '9999px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
        width: 'fit-content',
        marginLeft: '8px',
        marginBottom: '4px',
      }}
    >
      <img
        src={avatarUrl}
        alt={name || 'User'}
        className="typing-avatar w-[22px] h-[22px] rounded-full object-cover shrink-0"
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/logo.jpg';
        }}
      />
      <div
        className="typing-hashes inline-flex items-center gap-[3px] font-mono font-black text-[14px] leading-none"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontFamily: 'Courier New, monospace',
          fontWeight: 900,
          fontSize: '14px',
          lineHeight: 1,
        }}
      >
        <span
          className="hash-dot text-[#00a884]"
          style={{
            color: '#00a884',
            display: 'inline-block',
            animation: 'hashBlink 1.2s infinite ease-in-out',
            animationDelay: '0s',
          }}
        >
          #
        </span>
        <span
          className="hash-dot text-[#00a884]"
          style={{
            color: '#00a884',
            display: 'inline-block',
            animation: 'hashBlink 1.2s infinite ease-in-out',
            animationDelay: '0.2s',
          }}
        >
          #
        </span>
        <span
          className="hash-dot text-[#00a884]"
          style={{
            color: '#00a884',
            display: 'inline-block',
            animation: 'hashBlink 1.2s infinite ease-in-out',
            animationDelay: '0.4s',
          }}
        >
          #
        </span>
      </div>
      <span
        className="typing-text text-[12.5px] text-[#8696a0] font-medium"
        style={{
          fontSize: '12.5px',
          color: '#8696a0',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default TypingIndicator;
