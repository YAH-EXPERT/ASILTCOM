
export interface Contact {
  id: string;
  name: string;
  phoneNumber: string; // "Universal Number"
  avatarUrl?: string;
  coverUrl?: string; // Facebook-style cover photo
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
}

export interface Message {
  id: string;
  contactId: string;
  sender: 'user' | 'contact';
  text: string;
  imageUrl?: string; // Optional image URL for photo messages
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface ChatState {
  [contactId: string]: Message[];
}

// --- THEME SYSTEM ---
export type ThemeMode = 'light' | 'night' | 'sifi' | 'tropical' | 'futurist';

export interface ThemeColors {
  id: ThemeMode;
  name: string;
  bgApp: string;        // Outer background (desktop margins)
  bgPanel: string;      // Main panel background (sidebar, headers)
  bgChat: string;       // Chat area background
  bgMessageSent: string;
  bgMessageReceived: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;       // Primary interactive color
  border: string;
  inputBg: string;
  
  // Specific for Social/Infinity View
  socialBg: string;
  socialCardBg: string;
}
