import React from 'react';

/**
 * NEXCHAT v2 Master Message Bubble
 * Layout: 14px top, 2px bottom tail, "◍ NEX Sealed" Badge, Cyan Time
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

export interface MessageBubbleProps {
  id: string;
  text: string;
  isOwn: boolean;
  timeString: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  replyTo?: {
    senderName: string;
    text: string;
  };
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isOwn,
  timeString,
  status = 'read',
  replyTo,
}) => {
  const bubbleRadius = isOwn ? '14px 14px 2px 14px' : '14px 14px 14px 2px';
  const background = isOwn
    ? 'linear-gradient(135deg, #0b253a 0%, #0d3b4f 100%)'
    : '#0A0F1E';
  const border = isOwn
    ? '1px solid rgba(0, 255, 198, 0.28)'
    : '1px solid rgba(255, 255, 255, 0.08)';

  return (
    <div
      className={`message-wrapper ${isOwn ? 'sent' : 'received'}`}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        margin: '6px 0',
        padding: '0 12px',
      }}
    >
      <div
        className={`message-bubble ${isOwn ? 'sent' : 'received'}`}
        style={{
          position: 'relative',
          padding: '8px 12px 6px 12px',
          borderRadius: bubbleRadius,
          maxWidth: '75%',
          wordBreak: 'break-word',
          boxShadow: isOwn
            ? '0 4px 14px rgba(0, 255, 198, 0.12)'
            : '0 2px 8px rgba(0, 0, 0, 0.35)',
          background,
          border,
          color: '#f1f5f9',
          fontSize: '14px',
          lineHeight: '1.45',
        }}
      >
        {/* Reply Quote Header */}
        {replyTo && (
          <div
            className="reply-quote"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderLeft: '3px solid #00FFC6',
              padding: '4px 8px',
              marginBottom: '6px',
              borderRadius: '4px',
              fontSize: '11.5px',
            }}
          >
            <strong style={{ color: '#00FFC6', display: 'block', marginBottom: '2px' }}>
              {replyTo.senderName}
            </strong>
            <span style={{ fontStyle: 'italic', opacity: 0.85 }}>{replyTo.text}</span>
          </div>
        )}

        {/* Message Content */}
        <div className="message-content" style={{ margin: 0 }}>
          {text}
        </div>

        {/* Message Footer: "◍ NEX Sealed" Badge & Cyan Time */}
        <div
          className="message-time-row"
          style={{
            fontSize: '10.5px',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
          }}
        >
          {/* NEX Sealed Badge replaces WhatsApp lock */}
          <span
            className="nex-sealed-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '9.5px',
              color: '#00FFC6',
              opacity: 0.85,
              fontWeight: 600,
              letterSpacing: '0.3px',
              marginRight: 'auto',
            }}
            title="End-to-End Quantum Enclave Sealed"
          >
            <span style={{ fontSize: '10px' }}>&#x25CD;</span>
            <span>NEX Sealed</span>
          </span>

          {/* Cyan Time Text */}
          <span
            className="message-time-text"
            style={{
              color: '#00FFC6',
              fontSize: '10px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <span>{timeString}</span>
            {isOwn && (
              <span style={{ color: '#00FFC6', fontSize: '9px' }}>
                {status === 'read' ? (
                  <i className="fa-solid fa-check-double" />
                ) : (
                  <i className="fa-solid fa-check" />
                )}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
