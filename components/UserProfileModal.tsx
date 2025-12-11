
import React from 'react';
import { X, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { Contact, ThemeColors } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onOpenSocial: () => void;
  theme: ThemeColors;
}

const CONTACT_DETAILS: Record<string, any> = {
  'ai-nara': {
    job: 'Ambassadrice Culturelle & Modèle IA',
    address: 'Dakar, Sénégal',
    email: 'nara@asiltcom.ai',
    bio: 'Passionnée par la culture africaine, la mode et les conversations profondes. 🌍✨',
  },
  'ai-yah': {
    job: 'Intelligence Artificielle Nationale',
    address: 'Antananarivo, Madagascar',
    email: 'contact@mgai.mg',
    bio: 'Ny fahendrena no harena. Solontenan\'ny kolontsaina Malagasy. 🇲🇬',
  },
  'default': {
    job: 'User',
    address: 'Unknown Location',
    email: 'user@example.com',
    bio: 'Hey there! I am using ASILTCOM.',
  }
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  contact,
  onOpenSocial,
  theme
}) => {
  if (!isOpen) return null;

  const details = CONTACT_DETAILS[contact.id] || CONTACT_DETAILS['default'];

  // Infinity Logo adapted to theme
  const InfinityLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 60" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M20,30 C20,10 40,10 50,30 C60,50 80,50 80,30 C80,10 60,10 50,30 C40,50 20,50 20,30 Z" className="opacity-50" />
        <path d="M20,30 C20,10 40,10 50,30" stroke={theme.accent} strokeDasharray="60" strokeDashoffset="0">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="2s" repeatCount="indefinite" />
        </path>
        <circle cx="20" cy="30" r="4" fill={theme.accent}>
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="30" r="4" fill={theme.textPrimary}>
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1s"/>
        </circle>
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:justify-center md:items-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full md:w-[400px] h-full md:h-[85vh] md:rounded-lg shadow-2xl overflow-y-auto flex flex-col animate-slide-in-right md:animate-fade-in transition-colors"
        style={{ backgroundColor: theme.socialBg }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm transition-colors" style={{ backgroundColor: theme.bgPanel, color: theme.textPrimary }}>
          <button onClick={onClose} className="hover:opacity-70 p-2 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-medium">Infos du contact</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-8">
            
            {/* Big Avatar */}
            <div className="pb-6 pt-10 flex flex-col items-center shadow-sm mb-3 relative overflow-hidden transition-colors" style={{ backgroundColor: theme.bgPanel }}>
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-current to-transparent opacity-10" style={{ color: theme.accent }}></div>

                <img 
                    src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/400`} 
                    alt={contact.name}
                    className="w-40 h-40 rounded-full object-cover shadow-lg mb-4 z-10 border-4 transition-colors"
                    style={{ borderColor: theme.bgPanel }}
                />
                <h1 className="text-2xl font-semibold text-center px-4 z-10" style={{ color: theme.textPrimary }}>{contact.name}</h1>
                <p className="mt-1 z-10" style={{ color: theme.textSecondary }}>{contact.phoneNumber}</p>
                
                {/* INFINITY CHAT BUTTON */}
                <button 
                    onClick={onOpenSocial}
                    className="mt-6 px-8 py-3 font-bold rounded-lg hover:opacity-90 transition-all shadow-lg flex items-center gap-3 group border hover:scale-105 active:scale-95"
                    style={{ backgroundColor: theme.textPrimary, color: theme.bgPanel, borderColor: theme.border }}
                >
                    <div className="w-8 h-5">
                         <InfinityLogo className="w-full h-full" />
                    </div>
                    <span className="tracking-widest text-sm">INFINITY CHAT</span>
                </button>
            </div>

            {/* About Section */}
            <div className="p-4 shadow-sm mb-3 transition-colors" style={{ backgroundColor: theme.bgPanel }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: theme.accent }}>Actu</h3>
                <p className="text-base" style={{ color: theme.textPrimary }}>{details.bio}</p>
                <p className="text-xs mt-2" style={{ color: theme.textSecondary }}>Ce jour</p>
            </div>

            {/* Details Section */}
            <div className="px-6 py-2 shadow-sm mb-3 transition-colors" style={{ backgroundColor: theme.bgPanel }}>
                <div className="py-4 flex gap-4 items-center border-b" style={{ borderColor: theme.border }}>
                    <Briefcase className="w-5 h-5" style={{ color: theme.textSecondary }} />
                    <div>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>Profession</p>
                        <p style={{ color: theme.textPrimary }}>{details.job}</p>
                    </div>
                </div>
                <div className="py-4 flex gap-4 items-center border-b" style={{ borderColor: theme.border }}>
                    <MapPin className="w-5 h-5" style={{ color: theme.textSecondary }} />
                    <div>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>Domicile</p>
                        <p style={{ color: theme.textPrimary }}>{details.address}</p>
                    </div>
                </div>
                <div className="py-4 flex gap-4 items-center border-b" style={{ borderColor: theme.border }}>
                    <Mail className="w-5 h-5" style={{ color: theme.textSecondary }} />
                    <div>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>Email</p>
                        <p style={{ color: theme.textPrimary }}>{details.email}</p>
                    </div>
                </div>
                <div className="py-4 flex gap-4 items-center">
                    <Phone className="w-5 h-5" style={{ color: theme.textSecondary }} />
                    <div>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>Mobile</p>
                        <p style={{ color: theme.textPrimary }}>{contact.phoneNumber}</p>
                    </div>
                </div>
            </div>

            {/* Encryption Note */}
            <div className="p-4 text-center">
                <p className="text-xs flex items-center justify-center gap-1" style={{ color: theme.textSecondary }}>
                    🔒 Chiffrement de bout en bout
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};
