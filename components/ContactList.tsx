import React from 'react';
import { Contact } from '../types';
import { User, MessageSquarePlus, Search } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onAddContact: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  activeContactId,
  onSelectContact,
  onAddContact,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="bg-[#f0f2f5] p-4 flex justify-between items-center h-16 border-b border-gray-200">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                <User className="text-gray-500 w-6 h-6" />
            </div>
            <span className="font-semibold text-gray-700">My Chats</span>
        </div>
        <button
          onClick={onAddContact}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="New Contact"
        >
          <MessageSquarePlus className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 bg-white border-b border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-[#f0f2f5] text-sm focus:ring-0 placeholder-gray-500"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No contacts found.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact.id)}
              className={`flex items-center p-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-gray-100 ${
                activeContactId === contact.id ? 'bg-[#f0f2f5]' : ''
              }`}
            >
              <div className="flex-shrink-0 mr-3">
                <img
                  src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {contact.name}
                  </h3>
                  {contact.lastMessageTime && (
                    <span className="text-xs text-gray-500">
                      {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 truncate pr-2">
                    {contact.lastMessage || `Number: ${contact.phoneNumber}`}
                  </p>
                  {/* Badge */}
                  {contact.unreadCount ? (
                    <span className="bg-[#25D366] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
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
