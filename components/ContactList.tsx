
import React, { useState } from 'react';
import { Contact, ThemeColors, ThemeMode } from '../types';
import { User, MessageSquarePlus, Search, Shield, Palette } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onAddContact: () => void;
  onOpenAdmin: () => void;
  theme: ThemeColors;
  onThemeChange: (mode: ThemeMode) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  activeContactId,
  onSelectContact,
  onAddContact,
  onOpenAdmin,
  theme,
  onThemeChange
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber.includes(searchTerm)
  );

  const themes: { id: ThemeMode; label: string; color: string }[] = [
      { id: 'light', label: 'Classique', color: '#d1d7db' },
      { id: 'night', label: 'Night', color: '#090e11' },
      { id: 'sifi', label: 'SIFI Neon', color: '#050510' },
      { id: 'tropical', label: 'Madagascar', color: '#004d40' },
      { id: 'futurist', label: 'Futurist', color: '#e2e8f0' },
  ];

  return (
    <div className="flex flex-col h-full transition-colors duration-300" style={{ backgroundColor: theme.bgPanel, borderRight: `1px solid ${theme.border}` }}>
      {/* Header */}
      <div className="p-3 flex justify-between items-center h-16 border-b transition-colors duration-300" style={{ backgroundColor: theme.inputBg, borderBottomColor: theme.border }}>
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border transition-colors" style={{ backgroundColor: theme.bgPanel, borderColor: theme.border }}>
                <User className="w-5 h-5" style={{ color: theme.textSecondary }} />
            </div>
        </div>
        
        <div className="flex items-center gap-1">
            {/* Theme Selector - Next to Admin */}
            <div className="relative">
                <button
                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                    className="p-2 rounded-full transition-colors hover:opacity-80"
                    title="Changer le thème"
                    style={{ color: isThemeMenuOpen ? theme.accent : theme.textSecondary }}
                >
                    <Palette className="w-5 h-5" />
                </button>
                
                {isThemeMenuOpen && (
                    <div className="absolute right-0 top-12 w-48 rounded-xl shadow-2xl py-2 z-50 animate-fade-in border overflow-hidden" style={{ backgroundColor: theme.bgPanel, borderColor: theme.border }}>
                        <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: theme.textSecondary }}>Apparence</div>
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    onThemeChange(t.id);
                                    setIsThemeMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:opacity-80 transition-colors flex items-center gap-3"
                                style={{ 
                                    color: theme.id === t.id ? theme.accent : theme.textPrimary,
                                    backgroundColor: theme.id === t.id ? theme.inputBg : 'transparent'
                                }}
                            >
                                <div className="w-4 h-4 rounded-full border border-gray-500/20 shadow-sm" style={{ backgroundColor: t.color }}></div>
                                <span className="font-medium">{t.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={onOpenAdmin}
                className="p-2 rounded-full transition-colors hover:opacity-80"
                title="Espace Admin"
                style={{ color: theme.textSecondary }}
            >
                <Shield className="w-5 h-5" />
            </button>
            <button
                onClick={onAddContact}
                className="p-2 rounded-full transition-colors hover:opacity-80"
                title="Nouveau Contact"
                style={{ color: theme.textSecondary }}
            >
                <MessageSquarePlus className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b transition-colors duration-300" style={{ backgroundColor: theme.bgPanel, borderColor: theme.border }}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 opacity-50" style={{ color: theme.textPrimary }} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-none rounded-lg text-sm focus:ring-0 placeholder-opacity-50 transition-colors"
            style={{ backgroundColor: theme.inputBg, color: theme.textPrimary }}
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-sm opacity-60" style={{ color: theme.textSecondary }}>
            Aucun contact trouvé.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className={`flex items-center p-3 cursor-pointer transition-all border-b hover:opacity-90`}
              style={{ 
                  backgroundColor: activeContactId === contact.id ? theme.inputBg : 'transparent',
                  borderColor: theme.border
              }}
            >
              <div className="flex-shrink-0 mr-3">
                <img
                  src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover border"
                  style={{ borderColor: theme.border }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-medium truncate" style={{ color: theme.textPrimary }}>
                    {contact.name}
                  </h3>
                  {contact.lastMessageTime && (
                    <span className="text-xs opacity-70" style={{ color: theme.textSecondary }}>
                      {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm truncate pr-2 opacity-80" style={{ color: theme.textSecondary }}>
                    {contact.lastMessage || `Tel: ${contact.phoneNumber}`}
                  </p>
                  {contact.unreadCount ? (
                    <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm" style={{ backgroundColor: theme.accent }}>
                      {contact.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
