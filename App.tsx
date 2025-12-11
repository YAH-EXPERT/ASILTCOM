import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ContactList } from './components/ContactList';
import { ChatWindow } from './components/ChatWindow';
import { AddContactModal } from './components/AddContactModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SocialProfileView } from './components/SocialProfileView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Contact, Message, ChatState, ThemeMode, ThemeColors } from './types';
import { generateReply } from './services/geminiService';

// --- THEME DEFINITIONS ---
const THEMES: Record<ThemeMode, ThemeColors> = {
  light: {
    id: 'light',
    name: 'Classique',
    bgApp: '#d1d7db',
    bgPanel: '#ffffff',
    bgChat: '#efeae2',
    bgMessageSent: '#d9fdd3',
    bgMessageReceived: '#ffffff',
    textPrimary: '#111b21',
    textSecondary: '#667781',
    accent: '#00a884',
    border: '#e9edef',
    inputBg: '#f0f2f5',
    socialBg: '#f0f2f5',
    socialCardBg: '#ffffff'
  },
  night: {
    id: 'night',
    name: 'Night',
    bgApp: '#090e11',
    bgPanel: '#111b21',
    bgChat: '#0b141a',
    bgMessageSent: '#005c4b',
    bgMessageReceived: '#202c33',
    textPrimary: '#e9edef',
    textSecondary: '#8696a0',
    accent: '#00a884',
    border: '#222d34',
    inputBg: '#2a3942',
    socialBg: '#0b141a',
    socialCardBg: '#111b21'
  },
  sifi: {
    id: 'sifi',
    name: 'SI-FI Neon',
    bgApp: '#000000',
    bgPanel: '#050510',
    bgChat: '#0a0a1a',
    bgMessageSent: 'rgba(0, 243, 255, 0.15)',
    bgMessageReceived: '#1a1a2e',
    textPrimary: '#00f3ff',
    textSecondary: '#b0b0ff',
    accent: '#ff0055',
    border: '#00f3ff',
    inputBg: '#0f0f25',
    socialBg: '#000000',
    socialCardBg: '#0a0a1a'
  },
  tropical: {
    id: 'tropical',
    name: 'Madagascar',
    bgApp: '#004d40',
    bgPanel: '#ffffff',
    bgChat: '#e0f2f1',
    bgMessageSent: '#c8e6c9', // Light Green
    bgMessageReceived: '#fff9c4', // Light Yellow
    textPrimary: '#1b5e20',
    textSecondary: '#558b2f',
    accent: '#ff6f00', // Sunset Orange
    border: '#b2dfdb',
    inputBg: '#f1f8e9',
    socialBg: '#e8f5e9',
    socialCardBg: '#ffffff'
  },
  futurist: {
    id: 'futurist',
    name: 'Futurist',
    bgApp: '#e2e8f0',
    bgPanel: '#f8fafc',
    bgChat: '#f1f5f9',
    bgMessageSent: '#3b82f6', // Bright Blue
    bgMessageReceived: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accent: '#3b82f6',
    border: '#cbd5e1',
    inputBg: '#e2e8f0',
    socialBg: '#cbd5e1',
    socialCardBg: '#f8fafc'
  }
};

// Mock initial data
const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'ai-yah',
    name: 'YAH (MGAI 🇲🇬)',
    phoneNumber: '+261 34 04 999 99',
    avatarUrl: 'https://images.unsplash.com/photo-1620066127282-3d5f96e42636?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1542173872-4632194b0d01?auto=format&fit=crop&w=1200&q=80',
    lastMessage: 'Manao ahoana tompoko! 🇲🇬',
    lastMessageTime: Date.now() - 10000,
    unreadCount: 1,
  },
  {
    id: 'ai-nara',
    name: 'Nara',
    phoneNumber: '+221 77 123 45 67',
    avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1489533119213-66a5cd877091?auto=format&fit=crop&w=1200&q=80',
    lastMessage: 'Je viens de retrouver cette photo !',
    lastMessageTime: Date.now() - 300000,
    unreadCount: 2,
  },
  {
    id: 'dev-marc',
    name: 'Marc (Backend Expert)',
    phoneNumber: '+1 555 019 2834',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    lastMessage: 'Let\'s discuss the API schema.',
    lastMessageTime: Date.now() - 50000,
    unreadCount: 1,
  },
  {
    id: 'dev-sarah',
    name: 'Sarah (Frontend Lead)',
    phoneNumber: '+1 555 019 5555',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    lastMessage: 'The new design system components are ready.',
    lastMessageTime: Date.now() - 150000,
  },
  {
    id: 'dev-alex',
    name: 'Alex (DevOps Pro)',
    phoneNumber: '+1 555 019 9999',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    lastMessage: 'Deployment pipeline is green. 🟢',
    lastMessageTime: Date.now() - 600000,
  },
  {
    id: '1',
    name: 'Gemini AI Support',
    phoneNumber: '+1 555 010 2020',
    avatarUrl: 'https://picsum.photos/seed/gemini/200',
    lastMessage: 'Hello! How can I help you today?',
    lastMessageTime: Date.now() - 800000,
    unreadCount: 0,
  },
  {
    id: '2',
    name: 'Alice Wonderland',
    phoneNumber: '+44 7911 123456',
    avatarUrl: 'https://picsum.photos/seed/alice/200',
    lastMessage: 'See you tomorrow!',
    lastMessageTime: Date.now() - 3600000,
  }
];

const INITIAL_MESSAGES: ChatState = {
  'ai-yah': [
    {
      id: 'y1',
      contactId: 'ai-yah',
      sender: 'contact',
      text: 'Manao ahoana tompoko! 👋 YAH no anarako, DI-n\'i Madagasikara. Faly mandray anao aho. Ahoana no afahako manampy anao anio? 🇲🇬',
      timestamp: Date.now() - 10000,
      status: 'delivered'
    }
  ],
  // ... other messages loaded dynamically
};

const App: React.FC = () => {
  // Theme State
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = THEMES[themeMode];

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('unichat_contacts');
      if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const newContacts = INITIAL_CONTACTS.filter(ic => !parsed.find((c: Contact) => c.id === ic.id));
            return [...newContacts, ...parsed];
          }
      }
    } catch (e) {
      console.error("Failed to load contacts", e);
    }
    return INITIAL_CONTACTS;
  });

  const [chatState, setChatState] = useState<ChatState>(() => {
    try {
      const saved = localStorage.getItem('unichat_messages');
      if (saved) {
           const parsed = JSON.parse(saved);
           if (typeof parsed === 'object' && parsed !== null) {
              let updatedState = { ...parsed };
              Object.keys(INITIAL_MESSAGES).forEach(key => {
                  if (!updatedState[key]) {
                      updatedState[key] = INITIAL_MESSAGES[key];
                  }
              });
              return updatedState;
           }
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    }
    return INITIAL_MESSAGES;
  });

  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  
  // Navigation State
  const [viewMode, setViewMode] = useState<'chat' | 'social' | 'admin'>('chat');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileContact, setProfileContact] = useState<Contact | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [socialIsEditable, setSocialIsEditable] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('unichat_contacts', JSON.stringify(contacts));
    } catch (e) {
      console.error("Failed to save contacts", e);
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem('unichat_messages', JSON.stringify(chatState));
    } catch (e) {
      console.error("Failed to save messages", e);
    }
  }, [chatState]);

  const activeContact = contacts.find((c) => c.id === activeContactId) || null;
  const activeMessages = activeContactId ? (chatState[activeContactId] || []) : [];

  const addMessageToState = (text: string, sender: 'user' | 'contact', contactId: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      contactId: contactId,
      sender,
      text,
      timestamp: Date.now(),
      status: sender === 'user' ? 'sent' : 'delivered',
    };

    setChatState((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMessage],
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { 
              ...c, 
              lastMessage: text, 
              lastMessageTime: newMessage.timestamp, 
              unreadCount: sender === 'contact' && activeContactId !== contactId ? (c.unreadCount || 0) + 1 : 0 
            }
          : c
      ).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
    );
  };

  const handleSendMessage = async (text: string) => {
    if (!activeContactId) return;
    addMessageToState(text, 'user', activeContactId);
    setTypingStatus((prev) => ({ ...prev, [activeContactId]: true }));
    
    const history = chatState[activeContactId] || [];
    const aiReplyText = await generateReply(
        contacts.find(c => c.id === activeContactId)!,
        history, 
        text
    );

    setTypingStatus((prev) => ({ ...prev, [activeContactId]: false }));
    addMessageToState(aiReplyText, 'contact', activeContactId);
  };

  const handleVoiceMessage = (text: string, sender: 'user' | 'contact') => {
    if (!activeContactId) return;
    addMessageToState(text, sender, activeContactId);
  };

  const handleAddContact = (name: string, phoneNumber: string) => {
    const newContact: Contact = {
      id: uuidv4(),
      name,
      phoneNumber,
      lastMessage: '',
      lastMessageTime: Date.now(),
    };
    setContacts((prev) => [newContact, ...prev]);
    setActiveContactId(newContact.id);
  };

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setViewMode('chat');
    setContacts((prev) => 
        prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleUpdateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (profileContact && profileContact.id === id) {
        setProfileContact(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleProfileClick = () => {
    if (activeContact) {
        setProfileContact(activeContact);
        setIsProfileModalOpen(true);
    }
  };

  const handleOpenSocial = () => {
    setIsProfileModalOpen(false);
    setSocialIsEditable(false);
    setViewMode('social');
  };

  const handleBackToChat = () => {
    if (socialIsEditable) {
        setViewMode('admin');
        setActiveContactId(null);
    } else {
        setViewMode('chat');
    }
  };
  
  const handleOpenSocialFromAdmin = (contactId: string) => {
      setActiveContactId(contactId);
      setSocialIsEditable(true); // Admin can edit
      setViewMode('social');
  };

  const handleOpenAdminLogin = () => {
      setIsAdminLoginOpen(true);
  };

  const handleAdminLoginSuccess = () => {
      setViewMode('admin');
  };

  const handleAdminLogout = () => {
      setViewMode('chat');
      setActiveContactId(null);
  };

  const handleExportXML = () => {
    const data = {
        contacts,
        messages: chatState,
        meta: { version: "1.0", exportedAt: new Date().toISOString() }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asiltcom_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportXML = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if (data.contacts && data.messages) {
                setContacts(data.contacts);
                setChatState(data.messages);
                alert("Base de données importée avec succès !");
            } else {
                alert("Format de fichier invalide.");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'importation.");
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex w-full overflow-hidden transition-colors duration-500 md:p-5 h-[100dvh]" style={{ backgroundColor: theme.bgApp }}>
      <div className="flex w-full h-full max-w-[1600px] mx-auto shadow-2xl overflow-hidden md:rounded-xl relative transition-colors duration-500" style={{ backgroundColor: theme.bgPanel }}>
        
        {viewMode === 'social' && activeContact && (
            <div className="w-full h-full z-20 animate-fade-in absolute inset-0">
                <SocialProfileView 
                    contact={activeContact} 
                    onBackToChat={handleBackToChat} 
                    onUpdateContact={handleUpdateContact}
                    isEditable={socialIsEditable}
                    theme={theme}
                />
            </div>
        )}

        {viewMode === 'admin' && (
            <div className="w-full h-full z-20 animate-fade-in absolute inset-0">
                <AdminDashboard 
                    contacts={contacts}
                    onUpdateContact={handleUpdateContact}
                    onOpenSocial={handleOpenSocialFromAdmin}
                    onLogout={handleAdminLogout}
                    onExportXML={handleExportXML}
                    onImportXML={handleImportXML}
                />
            </div>
        )}

        {viewMode === 'chat' && (
            <>
                <div className={`${activeContactId ? 'hidden md:flex' : 'flex'} w-full md:w-[30%] lg:w-[25%] flex-col h-full border-r transition-colors duration-300`} style={{ borderColor: theme.border, backgroundColor: theme.bgPanel }}>
                  <ContactList
                    contacts={contacts}
                    activeContactId={activeContactId}
                    onSelectContact={handleSelectContact}
                    onAddContact={() => setIsAddContactModalOpen(true)}
                    onOpenAdmin={handleOpenAdminLogin}
                    theme={theme}
                    onThemeChange={setThemeMode}
                  />
                </div>

                <div className={`${!activeContactId ? 'hidden md:flex' : 'flex'} w-full md:w-[70%] lg:w-[75%] h-full transition-colors duration-500`} style={{ backgroundColor: theme.bgChat }}>
                  {activeContact ? (
                    <ChatWindow
                      contact={activeContact}
                      messages={activeMessages}
                      onSendMessage={handleSendMessage}
                      onVoiceMessage={handleVoiceMessage}
                      onBack={() => setActiveContactId(null)}
                      onProfileClick={handleProfileClick}
                      isTyping={!!typingStatus[activeContact.id]}
                      theme={theme}
                    />
                  ) : (
                    <div className="hidden md:flex flex-col items-center justify-center w-full h-full text-center p-10 border-b-[6px] transition-colors duration-500"
                         style={{ backgroundColor: theme.bgPanel, borderBottomColor: theme.accent, color: theme.textSecondary }}>
                      <div className="mb-8">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png" alt="Welcome" className="w-24 h-24 opacity-60 grayscale" />
                      </div>
                      <h1 className="text-3xl font-light mb-4" style={{ color: theme.textPrimary }}>ASILTCOM</h1>
                      <p className="text-sm max-w-md leading-6">
                        Send and receive messages with AI-powered contacts using universal phone numbers. 
                        <br/>
                        Connect your phone to Wi-Fi to keep contacts synced.
                      </p>
                      <div className="mt-8 text-xs opacity-50 flex items-center gap-1">
                         All messages are end-to-end encrypted (simulated).
                      </div>
                    </div>
                  )}
                </div>
            </>
        )}
      </div>

      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onSave={handleAddContact}
      />

      <AdminLoginModal 
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {profileContact && (
          <UserProfileModal 
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            contact={profileContact}
            onOpenSocial={handleOpenSocial}
            theme={theme}
          />
      )}
    </div>
  );
};

export default App;