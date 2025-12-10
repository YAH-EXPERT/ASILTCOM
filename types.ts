export interface Contact {
  id: string;
  name: string;
  phoneNumber: string; // "Universal Number"
  avatarUrl?: string;
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