import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ContactList } from './components/ContactList';
import { ChatWindow } from './components/ChatWindow';
import { AddContactModal } from './components/AddContactModal';
import { Contact, Message, ChatState } from './types';
import { generateReply } from './services/geminiService';

// Mock initial data
const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'ai-yah',
    name: 'YAH (MGAI 🇲🇬)',
    phoneNumber: '+261 34 04 999 99',
    avatarUrl: 'https://images.unsplash.com/photo-1620066127282-3d5f96e42636?auto=format&fit=crop&w=200&q=80',
    lastMessage: 'Manao ahoana tompoko! 🇲🇬',
    lastMessageTime: Date.now() - 10000,
    unreadCount: 1,
  },
  {
    id: 'ai-nara',
    name: 'Nara',
    phoneNumber: '+221 77 123 45 67',
    avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
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
  'ai-nara': [
    {
      id: 'n1',
      contactId: 'ai-nara',
      sender: 'contact',
      text: 'Salut ! 👋 Je suis Nara. Ravie de faire ta connaissance.',
      timestamp: Date.now() - 400000,
      status: 'read'
    },
    {
      id: 'n2',
      contactId: 'ai-nara',
      sender: 'contact',
      text: 'J\'adore partager ma culture et mes souvenirs. Regarde, c\'était lors de mon dernier voyage à Dakar.',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      timestamp: Date.now() - 350000,
      status: 'read'
    },
    {
      id: 'n3',
      contactId: 'ai-nara',
      sender: 'contact',
      text: 'Je viens de retrouver cette photo !',
      imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=500&q=80',
      timestamp: Date.now() - 300000,
      status: 'delivered'
    }
  ],
  'dev-marc': [
    {
      id: 'dm1',
      contactId: 'dev-marc',
      sender: 'contact',
      text: 'Hey. I\'ve reviewed the database migration plan. We need to optimize the indexing strategy before deployment.',
      timestamp: Date.now() - 50000,
      status: 'delivered'
    }
  ],
  'dev-sarah': [
    {
      id: 'ds1',
      contactId: 'dev-sarah',
      sender: 'contact',
      text: 'Hi! I just pushed the new UI components. Let me know what you think about the micro-interactions on the button hover states.',
      timestamp: Date.now() - 150000,
      status: 'read'
    }
  ],
  'dev-alex': [
    {
      id: 'da1',
      contactId: 'dev-alex',
      sender: 'contact',
      text: 'Production deployment finished successfully. All systems operational. 🟢',
      timestamp: Date.now() - 600000,
      status: 'read'
    }
  ],
  '1': [
    {
      id: 'm1',
      contactId: '1',
      sender: 'contact',
      text: 'Hello! How can I help you today?',
      timestamp: Date.now() - 100000,
      status: 'read'
    }
  ],
  '2': [
    {
      id: 'm2',
      contactId: '2',
      sender: 'contact',
      text: 'See you tomorrow!',
      timestamp: Date.now() - 3600000,
      status: 'read'
    }
  ]
};

const App: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('unichat_contacts');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new contacts are merged in if missing
        const newContacts = INITIAL_CONTACTS.filter(ic => !parsed.find((c: Contact) => c.id === ic.id));
        return [...newContacts, ...parsed];
    }
    return INITIAL_CONTACTS;
  });

  const [chatState, setChatState] = useState<ChatState>(() => {
    const saved = localStorage.getItem('unichat_messages');
    if (saved) {
         const parsed = JSON.parse(saved);
         // Ensure initial messages for new contacts exist
         let updatedState = { ...parsed };
         Object.keys(INITIAL_MESSAGES).forEach(key => {
             if (!updatedState[key]) {
                 updatedState[key] = INITIAL_MESSAGES[key];
             }
         });
         return updatedState;
    }
    return INITIAL_MESSAGES;
  });

  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem('unichat_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('unichat_messages', JSON.stringify(chatState));
  }, [chatState]);

  const activeContact = contacts.find((c) => c.id === activeContactId) || null;
  const activeMessages = activeContactId ? (chatState[activeContactId] || []) : [];

  // Core helper to simply add a message to state
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

  // Logic for standard text chat (User sends -> AI replies)
  const handleSendMessage = async (text: string) => {
    if (!activeContactId) return;

    // 1. Add User Message
    addMessageToState(text, 'user', activeContactId);

    // 2. Trigger AI Reply
    setTypingStatus((prev) => ({ ...prev, [activeContactId]: true }));
    
    const history = chatState[activeContactId] || [];
    
    // Call Gemini
    const aiReplyText = await generateReply(
        contacts.find(c => c.id === activeContactId)!,
        history, 
        text
    );

    setTypingStatus((prev) => ({ ...prev, [activeContactId]: false }));

    // 3. Add AI Reply
    addMessageToState(aiReplyText, 'contact', activeContactId);
  };

  // Logic for Voice Call transcriptions (User/AI speak -> Text logged)
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
    setActiveContactId(newContact.id); // Auto switch to new chat
  };

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setContacts((prev) => 
        prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#d1d7db] md:p-5">
      <div className="flex w-full h-full max-w-[1600px] mx-auto bg-white shadow-lg overflow-hidden md:rounded-xl">
        
        {/* Sidebar - hidden on mobile if chat is active */}
        <div className={`${activeContactId ? 'hidden md:flex' : 'flex'} w-full md:w-[30%] lg:w-[25%] flex-col h-full`}>
          <ContactList
            contacts={contacts}
            activeContactId={activeContactId}
            onSelectContact={handleSelectContact}
            onAddContact={() => setIsModalOpen(true)}
          />
        </div>

        {/* Chat Area */}
        <div className={`${!activeContactId ? 'hidden md:flex' : 'flex'} w-full md:w-[70%] lg:w-[75%] h-full bg-[#efeae2]`}>
          {activeContact ? (
            <ChatWindow
              contact={activeContact}
              messages={activeMessages}
              onSendMessage={handleSendMessage}
              onVoiceMessage={handleVoiceMessage}
              onBack={() => setActiveContactId(null)}
              isTyping={!!typingStatus[activeContact.id]}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center w-full h-full text-center p-10 bg-[#f0f2f5] border-b-[6px] border-[#25D366]">
              <div className="mb-8">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png" alt="Welcome" className="w-24 h-24 opacity-60 grayscale" />
              </div>
              <h1 className="text-3xl font-light text-gray-700 mb-4">ASILTCOM</h1>
              <p className="text-gray-500 text-sm max-w-md leading-6">
                Send and receive messages with AI-powered contacts using universal phone numbers. 
                <br/>
                Connect your phone to Wi-Fi to keep contacts synced.
              </p>
              <div className="mt-8 text-xs text-gray-400 flex items-center gap-1">
                 All messages are end-to-end encrypted (simulated).
              </div>
            </div>
          )}
        </div>
      </div>

      <AddContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddContact}
      />
    </div>
  );
};

export default App;