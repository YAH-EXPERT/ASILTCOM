import React, { useState, useRef } from 'react';
import { Contact } from '../types';
import { Save, LogOut, Upload, Search, Infinity, Image as ImageIcon, Download, FileJson } from 'lucide-react';

interface AdminDashboardProps {
  contacts: Contact[];
  onUpdateContact: (id: string, updates: Partial<Contact>) => void;
  onOpenSocial: (id: string) => void;
  onLogout: () => void;
  onExportXML: () => void;
  onImportXML: (file: File) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  contacts,
  onUpdateContact,
  onOpenSocial,
  onLogout,
  onExportXML,
  onImportXML
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Local state for editing fields
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setEditName(contact.name);
    setEditAvatar(contact.avatarUrl || '');
  };

  const handleSave = () => {
    if (editingId) {
      onUpdateContact(editingId, {
        name: editName,
        avatarUrl: editAvatar
      });
      setEditingId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              setEditAvatar(base64String);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleXMLImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onImportXML(file);
      }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      <input type="file" ref={xmlInputRef} onChange={handleXMLImport} className="hidden" accept=".json,.xml" />

      {/* Admin Header - Responsive */}
      <div className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
        <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="bg-[#00a884] text-xs px-2 py-1 rounded text-white">ADMIN</span>
                <span className="hidden sm:inline">Gestion des Profils</span>
            </h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onExportXML}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                title="Sauvegarder XML"
            >
                <Download className="w-4 h-4" /> 
                <span className="hidden sm:inline">Sauver XML</span>
            </button>
            <button 
                onClick={() => xmlInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                title="Importer"
            >
                <FileJson className="w-4 h-4" /> 
                <span className="hidden sm:inline">Importer</span>
            </button>
            <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors ml-2"
                title="Déconnexion"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Rechercher un agent..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#00a884] focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
            {filteredContacts.map(contact => (
                <div key={contact.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative group">
                    <button 
                        onClick={() => onOpenSocial(contact.id)}
                        className="absolute top-2 right-2 p-2 bg-gray-900/50 hover:bg-[#00a884] text-white rounded-full backdrop-blur-sm transition-colors z-10"
                        title="Voir le Profil Social"
                    >
                        <Infinity className="w-5 h-5" />
                    </button>

                    <div className="p-4 flex items-center gap-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <img 
                                src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`} 
                                className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-gray-800 truncate">{contact.name}</h3>
                            <code className="text-xs text-gray-500 bg-gray-200 px-1 py-0.5 rounded">{contact.id}</code>
                        </div>
                    </div>

                    <div className="p-4 space-y-4 flex-1">
                        {editingId === contact.id ? (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nom d'affichage</label>
                                    <input 
                                        type="text" 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Photo</label>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full px-3 py-2 border border-dashed border-gray-400 rounded-lg text-gray-600 hover:bg-gray-50 text-xs flex justify-center gap-2 items-center"
                                    >
                                        <Upload className="w-4 h-4" /> Modifier Image
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-gray-600 space-y-2">
                                <p className="truncate"><span className="font-medium text-gray-900">Mobile:</span> {contact.phoneNumber}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                        {editingId === contact.id ? (
                            <div className="flex gap-2">
                                <button onClick={() => setEditingId(null)} className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm">Annuler</button>
                                <button onClick={handleSave} className="flex-1 px-3 py-2 bg-[#00a884] text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2"><Save className="w-4 h-4" /> Sauver</button>
                            </div>
                        ) : (
                            <button onClick={() => handleEdit(contact)} className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-blue-50 flex justify-center items-center gap-2"><Upload className="w-4 h-4" /> Modifier Info</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};