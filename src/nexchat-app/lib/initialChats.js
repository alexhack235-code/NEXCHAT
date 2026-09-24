// Initial dummy data pre-loaded into localStorage for NEXCHAT
export const INITIAL_CHATS = [
  {
    id: "nexchat-system",
    name: "NEXCHAT SYSTEM",
    avatar: "logo.jpg",
    isOnline: true,
    isGroup: false,
    isPinned: true,
    isMuted: false,
    unreadCount: 1,
    lastSeen: "Online (Quantum Relay)",
    statusRing: true,
    messages: [
      {
        id: "sys-1",
        sender: "them",
        type: "text",
        text: " *WELCOME TO NEXCHAT — CHAT BEYOND* \nYou are running the next-generation messaging terminal.",
        timestamp: "10:00 AM",
        status: "read",
      },
      {
        id: "sys-2",
        sender: "them",
        type: "code",
        code: "// NEXCHAT Quantum Cipher Initialization\nconst cipher = new NexCipher({\n  protocol: 'NEX-E2E-v4',\n  encryption: 'AES-GCM-256',\n  zeroKnowledge: true\n});\nconsole.log('[SECURITY] Terminal sync established.');",
        timestamp: "10:01 AM",
        status: "read",
      },
      {
        id: "sys-3",
        sender: "them",
        type: "system",
        text: " Messages and calls are end-to-end encrypted. No one outside of this chat can read them.",
        timestamp: "10:02 AM",
        status: "read",
      },
      {
        id: "sys-4",
        sender: "them",
        type: "text",
        text: " *Hacker Tip*: Try typing `help` in the right terminal panel to explore command-line chat operations!",
        timestamp: "10:05 AM",
        status: "read",
      }
    ]
  },
  {
    id: "alex-vance",
    name: "Alex Vance",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    isOnline: true,
    isGroup: false,
    isPinned: true,
    isMuted: false,
    unreadCount: 2,
    lastSeen: "Online",
    statusRing: true,
    messages: [
      {
        id: "alex-1",
        sender: "them",
        type: "text",
        text: "Hey! Did you check out the new 3-panel terminal split?",
        timestamp: "10:30 AM",
        status: "read",
      },
      {
        id: "alex-2",
        sender: "me",
        type: "text",
        text: "Yeah, it has full *two-way sync* with xterm commands. Type `call Alex Vance` to trigger calling!",
        timestamp: "10:32 AM",
        status: "read",
      },
      {
        id: "alex-3",
        sender: "them",
        type: "voice",
        duration: "0:18",
        timestamp: "10:35 AM",
        status: "read",
      },
      {
        id: "alex-4",
        sender: "them",
        type: "poll",
        question: "Which terminal theme looks sickest?",
        options: [
          { text: "NEX Neon Green (#00FF88)", votes: 4 },
          { text: "Cyberpunk Cyan (#00D4FF)", votes: 1 },
          { text: "Matrix Void Rain", votes: 3 }
        ],
        timestamp: "10:38 AM",
        status: "read",
      },
      {
        id: "alex-5",
        sender: "them",
        type: "text",
        text: "Check out this chandelier photo for the status update!",
        timestamp: "10:45 AM",
        status: "unread",
      }
    ]
  },
  {
    id: "mia-chen",
    name: "Mia Chen",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    isOnline: false,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Today at 09:42 AM",
    statusRing: true,
    messages: [
      {
        id: "mia-1",
        sender: "them",
        type: "text",
        text: "Check out this code snippet I just deployed into production:",
        timestamp: "09:30 AM",
        status: "read",
      },
      {
        id: "mia-2",
        sender: "them",
        type: "code",
        code: "export function parseMarkdownFormat(text) {\n  return text\n    .replace(/\\*([^*]+)\\*/g, '<b>$1</b>')\n    .replace(/_([^_]+)_/g, '<i>$1</i>')\n    .replace(/~([^~]+)~/g, '<del>$1</del>');\n}",
        timestamp: "09:31 AM",
        status: "read",
      },
      {
        id: "mia-3",
        sender: "me",
        type: "text",
        text: "Clean regex! ~Slow~ *Ultra-fast* execution.",
        timestamp: "09:35 AM",
        status: "read",
      }
    ]
  },
  {
    id: "cyber-squad-elite",
    name: " CYBER SQUAD ELITE ",
    avatar: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150",
    isOnline: true,
    isGroup: true,
    isPinned: true,
    isMuted: true,
    unreadCount: 5,
    lastSeen: "4 members: Alex, Mia, Devin, You",
    statusRing: false,
    messages: [
      {
        id: "grp-1",
        sender: "them",
        author: "Devin (AI)",
        type: "text",
        text: "Squad PR #42 approved. Ready to deploy the terminal sync engine.",
        timestamp: "08:15 AM",
        status: "read",
      },
      {
        id: "grp-2",
        sender: "them",
        author: "Mia Chen",
        type: "text",
        text: "Testing command `encrypt` across all active sockets.",
        timestamp: "08:20 AM",
        status: "read",
      },
      {
        id: "grp-3",
        sender: "me",
        type: "text",
        text: "Looking fantastic. Terminal logs react immediately to UI clicks.",
        timestamp: "08:22 AM",
        status: "read",
      }
    ]
  },
  {
    id: "devin-ai",
    name: "Devin (AI Engineer)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    isOnline: true,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Online",
    statusRing: true,
    messages: [
      {
        id: "dev-1",
        sender: "them",
        type: "text",
        text: "I finished reviewing the 1:1 Voice Calling and Photo Status specs. They match the design standards down to the exact pixel.",
        timestamp: "Yesterday",
        status: "read",
      }
    ]
  },
  {
    id: "sarah-connor",
    name: "Sarah Connor",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    isOnline: false,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Yesterday at 11:20 PM",
    statusRing: false,
    messages: [
      {
        id: "sc-1",
        sender: "them",
        type: "text",
        text: "No fate but what we make. Keeping the terminal connection live 24/7.",
        timestamp: "Yesterday",
        status: "read",
      }
    ]
  },
  {
    id: "cipher-ops",
    name: "Cipher Ops Group",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150",
    isOnline: true,
    isGroup: true,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "8 operatives connected",
    statusRing: false,
    messages: [
      {
        id: "co-1",
        sender: "them",
        author: "Operative 01",
        type: "text",
        text: "Hardware firewall integrity at 100%.",
        timestamp: "Yesterday",
        status: "read",
      }
    ]
  },
  {
    id: "david-miller",
    name: "David Miller",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    isOnline: false,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 1,
    lastSeen: "Last seen Friday",
    statusRing: false,
    messages: [
      {
        id: "dm-1",
        sender: "them",
        type: "file",
        fileName: "nexchat_terminal_keys.tar.gz",
        fileSize: "4.2 MB",
        timestamp: "Friday",
        status: "unread",
      }
    ]
  },
  {
    id: "elena-rostova",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    isOnline: true,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Online",
    statusRing: true,
    messages: [
      {
        id: "el-1",
        sender: "them",
        type: "text",
        text: "Are we jumping into a voice call?",
        timestamp: "Thursday",
        status: "read",
      }
    ]
  },
  {
    id: "marcus-wright",
    name: "Marcus Wright",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    isOnline: false,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Wednesday at 4:12 PM",
    statusRing: false,
    messages: [
      {
        id: "mw-1",
        sender: "them",
        type: "text",
        text: "The mechanical keyboard keycaps arrived. Green switches!",
        timestamp: "Wednesday",
        status: "read",
      }
    ]
  },
  {
    id: "crypto-whale",
    name: "Crypto Whale 0x7a",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150",
    isOnline: false,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Tuesday at 2:00 PM",
    statusRing: false,
    messages: [
      {
        id: "cw-1",
        sender: "them",
        type: "text",
        text: "Transferred 2,450 NEX tokens for the clan tournament.",
        timestamp: "Tuesday",
        status: "read",
      }
    ]
  },
  {
    id: "neo-anderson",
    name: "Neo Anderson",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    isOnline: true,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Online in the Matrix",
    statusRing: true,
    messages: [
      {
        id: "neo-1",
        sender: "them",
        type: "text",
        text: "I know kung fu... and TypeScript.",
        timestamp: "09/18",
        status: "read",
      }
    ]
  },
  {
    id: "trinity",
    name: "Trinity",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    isOnline: false,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "09/16 at 01:23 AM",
    statusRing: false,
    messages: [
      {
        id: "tr-1",
        sender: "them",
        type: "text",
        text: "The carrier line is secure. Keep your terminal open.",
        timestamp: "09/16",
        status: "read",
      }
    ]
  },
  {
    id: "chronex-ai",
    name: "Chronex AI Core",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
    isOnline: true,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "Active Autonomous Subroutine",
    statusRing: true,
    messages: [
      {
        id: "chr-1",
        sender: "them",
        type: "text",
        text: "Synthesized 12 new cipher protocols. Ready to compile.",
        timestamp: "09/14",
        status: "read",
      }
    ]
  },
  {
    id: "kaelen-byte",
    name: "Kaelen Byte",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    isOnline: false,
    isGroup: false,
    isPinned: false,
    isMuted: false,
    unreadCount: 0,
    lastSeen: "09/10 at 5:00 PM",
    statusRing: false,
    messages: [
      {
        id: "kb-1",
        sender: "them",
        type: "text",
        text: "Catch you on the dark web terminal ~later~ *now*.",
        timestamp: "09/10",
        status: "read",
      }
    ]
  }
];
