window.handleNavigation = function (navSection) {
    const sections = {
        chat: 'chatListView',
        status: 'statusContainer',
        groups: 'groupsContainer',
        announcements: 'announcementsContainer',
        calls: 'callHistoryContainer',
        marketplace: 'advertisement.html',
        games: 'gaminghub.html',
        terminal: 'terminal.html',
        video: 'chat.html'
    };

    const target = sections[navSection];
    if (!target) {
        const chatList = document.getElementById('chatListView');
        if (chatList) chatList.style.display = 'flex';
        return;
    }

    if (typeof target === 'string' && target.endsWith('.html')) {
        window.location.href = target;
        return;
    }

    document.querySelectorAll('.chat-list-view, .nex-status-container, .groups-container, .announcements-container, .call-history-container').forEach((section) => {
        section.style.display = 'none';
    });

    const element = document.getElementById(target);
    if (element) {
        element.style.display = 'block';
    }
};

window.__nexchatNavigationReady = true;
export const handleNavigation = window.handleNavigation;

