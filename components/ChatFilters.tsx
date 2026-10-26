import React from 'react';

/**
 * NEXCHAT v2 Master Chat Filters
 * Layout: All • Syndicates • AI Bots • Market • Unread (Anti-WhatsApp Clone)
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

export type FilterCategory = 'all' | 'syndicates' | 'ai-bots' | 'market' | 'unread';

export interface ChatFiltersProps {
  activeFilter: FilterCategory;
  onFilterChange: (category: FilterCategory) => void;
  onNewChat?: () => void;
}

export const ChatFilters: React.FC<ChatFiltersProps> = ({
  activeFilter,
  onFilterChange,
  onNewChat,
}) => {
  const filters: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'syndicates', label: 'Syndicates' },
    { id: 'ai-bots', label: 'AI Bots' },
    { id: 'market', label: 'Market' },
    { id: 'unread', label: 'Unread' },
  ];

  return (
    <div
      id="chatFilterTabs"
      className="chat-filter-tabs filter-tabs"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        padding: '8px 12px',
        scrollbarWidth: 'none',
        background: '#0A0F1E',
      }}
    >
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            className={`filter-tab ${isActive ? 'active' : ''}`}
            data-filter={f.id}
            onClick={() => onFilterChange(f.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: isActive ? '1.5px solid #00FFC6' : '1px solid rgba(0, 255, 198, 0.35)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(0, 255, 198, 0.25), rgba(0, 136, 255, 0.25))'
                : 'rgba(10, 15, 30, 0.75)',
              color: isActive ? '#00FFC6' : '#8696a0',
              fontWeight: isActive ? 700 : 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 0 16px rgba(0, 255, 198, 0.4)' : '0 0 10px rgba(0, 255, 198, 0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            {f.label}
          </button>
        );
      })}

      {onNewChat && (
        <button
          type="button"
          className="filter-tab add-chat-tab"
          onClick={onNewChat}
          title="Start New Direct Chat"
          style={{
            padding: '6px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(0, 255, 198, 0.35)',
            background: 'rgba(10, 15, 30, 0.75)',
            color: '#00FFC6',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-plus" />
        </button>
      )}
    </div>
  );
};
