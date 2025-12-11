import React, { useState, useEffect, useRef } from 'react';
import { Contact, ThemeColors } from '../types';
import { 
  ArrowLeft, MessageCircle, ThumbsUp, MessageSquare, Share2, 
  UserPlus, MoreHorizontal, Home, Bell, Menu, UserCheck, Send, Camera, 
  Image as ImageIcon, Trash2, Edit2, Flag, Save, X, Wand2, Sparkles
} from 'lucide-react';
import { enhancePostText, generatePostImage, editPostImage } from '../services/geminiService';

interface SocialProfileViewProps {
  contact: Contact;
  onBackToChat: () => void;
  onUpdateContact: (id: string, updates: Partial<Contact>) => void;
  isEditable: boolean;
  theme: ThemeColors;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  time: string;
}

interface Post {
  id: string;
  timeRaw: number;
  timeLabel: string;
  text: string;
  image: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  shares: number;
  showComments: boolean;
}

interface SocialProfile {
  followers: string;
  following: string;
  intro: string;
  isFriend: boolean;
  friendStatus: 'none' | 'requested' | 'friends';
  stories: string[];
  posts: Post[];
}

const RANDOM_CAPTIONS = [
  "Profiter de l'instant présent. ✨", "Work in progress... 💻", "La vie est belle ! ☀️", "Weekend vibes 🎉"
];

const generateRandomProfile = (contact: Contact): SocialProfile => {
  const isDev = contact.id.startsWith('dev');
  const isNara = contact.id === 'ai-nara';
  const isYah = contact.id === 'ai-yah';

  let intro = `📍 Internet\n💼 ${isDev ? 'Developer' : 'User'}`;
  let postKeywords = ['tech', 'coffee'];

  if (isNara) {
    postKeywords = ['fashion', 'travel'];
    intro = '📍 Dakar, Sénégal\n💼 Modèle & IA\n❤️ Aime le Thieboudienne et l\'Afrobeats';
  } else if (isYah) {
    postKeywords = ['nature', 'lemur'];
    intro = '📍 Madagascar\n🤖 MGAI Official\n🇲🇬 Fihavanana';
  }

  const posts: Post[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `post-${contact.id}-${i}`,
      timeRaw: Date.now() - (i * 86400000),
      timeLabel: `${i + 1} j`,
      text: RANDOM_CAPTIONS[i % RANDOM_CAPTIONS.length],
      image: `https://source.unsplash.com/random/800x600?${postKeywords[i % postKeywords.length]}&sig=${contact.id}${i}`,
      likes: Math.floor(Math.random() * 200),
      isLiked: false,
      shares: Math.floor(Math.random() * 20),
      showComments: false,
      comments: []
  }));

  return {
    followers: `${Math.floor(Math.random() * 20)}k`,
    following: `${Math.floor(Math.random() * 500)}`,
    intro,
    isFriend: false,
    friendStatus: 'none',
    stories: Array.from({ length: 3 }).map((_, i) => 
       `https://source.unsplash.com/random/400x800?${postKeywords[i % postKeywords.length]}&sig=${contact.id}story${i}`
    ),
    posts
  };
};

export const SocialProfileView: React.FC<SocialProfileViewProps> = ({ contact, onBackToChat, onUpdateContact, isEditable, theme }) => {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Post Creation
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Post Interaction
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [isEnhancingEdit, setIsEnhancingEdit] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(`social_profile_${contact.id}`);
      if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed && Array.isArray(parsed.posts)) {
             setProfile(parsed);
             return;
          }
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    }
    setProfile(generateRandomProfile(contact));
  }, [contact.id]);

  useEffect(() => {
    if (profile) {
      try {
        localStorage.setItem(`social_profile_${contact.id}`, JSON.stringify(profile));
      } catch (e) {
        console.error("Failed to save profile", e);
      }
    }
  }, [profile, contact.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover' | 'post') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              if (type === 'avatar') {
                  onUpdateContact(contact.id, { avatarUrl: result });
                  showToast("Photo de profil mise à jour !");
              } else if (type === 'cover') {
                  onUpdateContact(contact.id, { coverUrl: result });
                  showToast("Photo de couverture mise à jour !");
              } else if (type === 'post') {
                  setNewPostImage(result);
              }
              e.target.value = '';
          };
          reader.readAsDataURL(file);
      }
  };

  // AI FUNCTIONS
  const handleEnhanceText = async () => {
      if (!newPostText.trim()) return;
      setIsEnhancing(true);
      try {
          const enhanced = await enhancePostText(newPostText, contact.name);
          setNewPostText(enhanced);
          showToast("Texte amélioré ! ✨");
      } catch (e) {
          showToast("Erreur IA");
      }
      setIsEnhancing(false);
  };

  const handleGenerateOrEditImage = async () => {
      if (!newPostText.trim()) {
          showToast("Écrivez d'abord un texte pour générer ou modifier l'image.");
          return;
      }
      setIsGeneratingImg(true);
      try {
          let imgUrl: string | null = null;
          
          if (newPostImage) {
              // Edit existing image
              showToast("Modification de l'image en cours... 🎨");
              imgUrl = await editPostImage(newPostImage, newPostText);
          } else {
              // Generate new image
              showToast("Génération de l'image en cours... 🍌");
              imgUrl = await generatePostImage(newPostText);
          }

          if (imgUrl) {
              setNewPostImage(imgUrl);
              showToast("Image prête ! ✨");
          } else {
              showToast("Erreur lors de la création de l'image.");
          }
      } catch (e) {
          console.error(e);
          showToast("Erreur technique IA.");
      }
      setIsGeneratingImg(false);
  };

  const handleCreatePost = () => {
      if (!newPostText.trim() && !newPostImage) return;
      setProfile(prev => {
          if (!prev) return null;
          const newPost: Post = {
              id: `new-${Date.now()}`,
              timeRaw: Date.now(),
              timeLabel: 'À l\'instant',
              text: newPostText,
              image: newPostImage || `https://source.unsplash.com/random/800x600?tech&sig=${Date.now()}`,
              likes: 0,
              isLiked: false,
              comments: [],
              shares: 0,
              showComments: false
          };
          return { ...prev, posts: [newPost, ...prev.posts] };
      });
      setNewPostText('');
      setNewPostImage(null);
      showToast("Publication créée ! 🎉");
  };

  const handleLike = (postId: string) => {
    if (!profile) return;
    setProfile(prev => {
        if (!prev) return null;
        return {
            ...prev,
            posts: prev.posts.map(p => {
                if (p.id === postId) {
                    const newLiked = !p.isLiked;
                    return { ...p, isLiked: newLiked, likes: p.likes + (newLiked ? 1 : -1) };
                }
                return p;
            })
        };
    });
  };

  const handleDeletePost = (postId: string) => {
      if (window.confirm("Voulez-vous vraiment supprimer cette publication ?")) {
          setProfile(prev => prev ? ({ ...prev, posts: prev.posts.filter(p => p.id !== postId) }) : null);
          showToast("Publication supprimée.");
      }
      setOpenMenuId(null);
  };

  const handleStartEditPost = (post: Post) => {
      setEditingPostId(post.id);
      setEditingPostText(post.text);
      setOpenMenuId(null);
  };

  // AI Function for Edit Mode
  const handleEnhanceEditText = async () => {
      if (!editingPostText.trim()) return;
      setIsEnhancingEdit(true);
      try {
          const enhanced = await enhancePostText(editingPostText, contact.name);
          setEditingPostText(enhanced);
          showToast("Modification améliorée ! ✨");
      } catch (e) {
          showToast("Erreur IA");
      }
      setIsEnhancingEdit(false);
  };

  // Quick Enhance from Menu
  const handleQuickEnhance = async (post: Post) => {
      setOpenMenuId(null);
      showToast("Magie en cours... ✨");
      try {
          const enhanced = await enhancePostText(post.text, contact.name);
          setEditingPostId(post.id);
          setEditingPostText(enhanced);
          showToast("Post amélioré ! Vérifiez et validez.");
      } catch (e) {
          showToast("Erreur IA");
          // Fallback to normal edit if fail
          handleStartEditPost(post);
      }
  };

  const handleSaveEditPost = () => {
      if (editingPostId) {
          setProfile(prev => prev ? ({
              ...prev,
              posts: prev.posts.map(p => p.id === editingPostId ? { ...p, text: editingPostText } : p)
          }) : null);
          setEditingPostId(null);
          showToast("Modification enregistrée !");
      }
  };

  const handleSharePost = () => {
      showToast("Publication partagée sur votre fil !");
      setOpenMenuId(null);
  };

  const handleReportPost = () => {
      showToast("Signalement envoyé aux admins.");
      setOpenMenuId(null);
  };

  // Infinity Logo adapted to Theme
  const InfinityLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 60" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
      <path d="M20,30 C20,10 40,10 50,30 C60,50 80,50 80,30 C80,10 60,10 50,30 C40,50 20,50 20,30 Z" className="opacity-50" />
      <path d="M20,30 C20,10 40,10 50,30" stroke={theme.accent} strokeDasharray="60" strokeDashoffset="0">
        <animate attributeName="stroke-dashoffset" from="60" to="0" dur="2s" repeatCount="indefinite" />
      </path>
      <circle cx="20" cy="30" r="4" fill={theme.accent}>
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="80" cy="30" r="4" fill={theme.id === 'sifi' ? '#ff0055' : theme.textPrimary}>
         <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1s"/>
      </circle>
    </svg>
  );

  if (!profile) return <div className="p-10 text-center" style={{ color: theme.textPrimary }}>Chargement...</div>;

  return (
    <div className="flex flex-col h-full overflow-y-auto relative pb-16 custom-scrollbar font-sans transition-colors duration-500" style={{ backgroundColor: theme.socialBg, color: theme.textPrimary }}>
      
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
      <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'post')} />

      {/* Toast */}
      {toastMessage && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-sm font-bold shadow-lg z-50 animate-fade-in-up" 
               style={{ backgroundColor: theme.accent, color: '#fff', boxShadow: `0 0 20px ${theme.accent}40` }}>
              {toastMessage}
          </div>
      )}

      {/* Top Nav */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 drop-shadow-md" style={{ color: '#fff' }}>
        <button onClick={onBackToChat} className="bg-black/30 p-2 rounded-full backdrop-blur-md hover:bg-black/40 transition">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-gray-500/30">
            <InfinityLogo className="w-8 h-5" />
            <span className="text-xs font-bold tracking-widest" style={{ color: theme.accent }}>INFINITY</span>
        </div>
        <button className="bg-black/30 p-2 rounded-full backdrop-blur-md hover:bg-black/40 transition">
            <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Cover Photo */}
      <div className="relative h-60 w-full bg-gray-800 group border-b" style={{ borderColor: theme.border }}>
        <img src={contact.coverUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80'} alt="Cover" className="w-full h-full object-cover" />
        {isEditable && (
            <button 
                onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                className="absolute bottom-4 right-4 bg-black/70 p-2 rounded-full text-white hover:opacity-80 transition-all border shadow-lg z-30 cursor-pointer"
                style={{ borderColor: theme.accent }}
            >
                <Camera className="w-5 h-5" />
            </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 mb-2 relative shadow-lg transition-colors" style={{ backgroundColor: theme.socialCardBg }}>
        <div className="relative -mt-16 mb-3 flex justify-center w-full">
            <div className="w-32 h-32 rounded-full p-1 inline-block shadow-xl relative group z-10 transition-colors" style={{ backgroundColor: theme.socialCardBg }}>
                <img 
                    src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover border-2"
                    style={{ borderColor: theme.accent }}
                />
                {isEditable && (
                    <div 
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        <Camera className="w-8 h-8" style={{ color: theme.accent }} />
                    </div>
                )}
            </div>
        </div>

        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2 transition-colors" style={{ color: theme.textPrimary }}>
                {contact.name}
                <svg className="w-5 h-5" style={{ color: theme.accent }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </h1>
            <p className="font-medium mt-1 text-sm" style={{ color: theme.textSecondary }}>{profile.followers} abonnés • {profile.following} abonnements</p>
        </div>

        <div className="flex gap-2 mb-4">
            <button className="flex-1 text-white font-bold py-2 rounded-lg flex justify-center items-center gap-2 hover:opacity-90 transition-colors" style={{ backgroundColor: theme.accent }}>
                <UserPlus className="w-5 h-5" /> S'abonner
            </button>
            <button className="flex-1 font-semibold py-2 rounded-lg flex justify-center items-center gap-2 hover:opacity-80 transition-colors" onClick={onBackToChat} style={{ backgroundColor: theme.inputBg, color: theme.textPrimary }}>
                <MessageCircle className="w-5 h-5" /> Message
            </button>
        </div>

        <div className="border-t pt-3 text-center transition-colors" style={{ borderColor: theme.border }}>
            <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: theme.textSecondary }}>{profile.intro}</p>
        </div>
      </div>

      {/* CREATE POST */}
      {isEditable && (
        <div className="p-4 mb-3 border-t border-b transition-colors" style={{ backgroundColor: theme.socialCardBg, borderColor: theme.border }}>
            <h3 className="text-sm font-semibold mb-2 uppercase" style={{ color: theme.textSecondary }}>Quoi de neuf ?</h3>
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: theme.border }}>
                    <img src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <div className="relative">
                        <textarea 
                            placeholder={`Publier en tant que ${contact.name}...`}
                            className="w-full rounded-lg px-4 py-2 border focus:outline-none mb-2 transition-colors min-h-[80px]"
                            style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.border }}
                            value={newPostText}
                            onChange={(e) => setNewPostText(e.target.value)}
                        />
                        <div className="absolute bottom-4 right-2 flex gap-1">
                            <button onClick={handleEnhanceText} disabled={isEnhancing} className="p-1.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" title="AI Enhance">
                                <Wand2 className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {newPostImage && (
                        <div className="relative w-20 h-20 mb-2">
                             <img src={newPostImage} className="w-full h-full object-cover rounded-lg border" style={{ borderColor: theme.border }} />
                             <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"><ArrowLeft className="w-3 h-3" /></button>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button onClick={() => postImageInputRef.current?.click()} className="flex items-center gap-1 text-sm font-medium" style={{ color: theme.accent }}>
                                <ImageIcon className="w-4 h-4" /> Photo
                            </button>
                            <button onClick={handleGenerateOrEditImage} disabled={isGeneratingImg} className="flex items-center gap-1 text-sm font-medium text-purple-500 hover:text-purple-600" title="Générer Image">
                                <Sparkles className={`w-4 h-4 ${isGeneratingImg ? 'animate-pulse' : ''}`} /> 
                                {newPostImage ? 'Modifier (IA)' : 'Générer (IA)'}
                            </button>
                        </div>
                        <button onClick={handleCreatePost} className="px-4 py-1 rounded-full text-sm font-bold hover:opacity-80" style={{ backgroundColor: theme.textPrimary, color: theme.bgPanel }}>
                            Publier
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2 pb-4">
        {profile.posts.map((post) => (
            <div key={post.id} className="p-4 border-b relative transition-colors" style={{ backgroundColor: theme.socialCardBg, borderColor: theme.border }}>
                <div className="flex items-center justify-between mb-3 relative">
                    <div className="flex items-center gap-2">
                        <img src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`} className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: theme.border }} />
                        <div>
                            <h4 className="font-bold leading-tight" style={{ color: theme.textPrimary }}>{contact.name}</h4>
                            <div className="flex items-center gap-1 text-xs" style={{ color: theme.textSecondary }}>
                                <span>{post.timeLabel}</span>
                                <span>•</span>
                                <span>🌍</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === post.id ? null : post.id); }}
                            className="p-2 rounded-full hover:bg-gray-200/10 transition-colors"
                            style={{ color: theme.textSecondary }}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {openMenuId === post.id && (
                            <div className="absolute right-0 top-8 w-48 rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in origin-top-right border"
                                 style={{ backgroundColor: theme.bgPanel, borderColor: theme.border }}>
                                {isEditable && (
                                    <>
                                        <button onClick={() => handleStartEditPost(post)} className="w-full text-left px-4 py-3 hover:bg-gray-100/10 flex items-center gap-3 text-sm transition-colors" style={{ color: theme.textPrimary }}>
                                            <Edit2 className="w-4 h-4" /> Modifier
                                        </button>
                                        <button onClick={() => handleQuickEnhance(post)} className="w-full text-left px-4 py-3 hover:bg-gray-100/10 flex items-center gap-3 text-sm transition-colors text-blue-500 font-medium">
                                            <Wand2 className="w-4 h-4" /> Améliorer (IA)
                                        </button>
                                        <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-3 hover:bg-gray-100/10 flex items-center gap-3 text-sm text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" /> Supprimer
                                        </button>
                                        <div className="h-px mx-2" style={{ backgroundColor: theme.border }}></div>
                                    </>
                                )}
                                <button onClick={handleSharePost} className="w-full text-left px-4 py-3 hover:bg-gray-100/10 flex items-center gap-3 text-sm transition-colors" style={{ color: theme.textPrimary }}>
                                    <Share2 className="w-4 h-4" /> Partager
                                </button>
                                <button onClick={handleReportPost} className="w-full text-left px-4 py-3 hover:bg-gray-100/10 flex items-center gap-3 text-sm transition-colors" style={{ color: theme.textPrimary }}>
                                    <Flag className="w-4 h-4" /> Signaler
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {openMenuId === post.id && (<div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>)}

                {editingPostId === post.id ? (
                    <div className="mb-3 animate-fade-in relative">
                        <textarea 
                            value={editingPostText} 
                            onChange={(e) => setEditingPostText(e.target.value)}
                            className="w-full rounded-lg p-3 border focus:outline-none min-h-[100px] text-sm pr-8"
                            style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, borderColor: theme.accent }}
                            autoFocus
                        />
                        {/* Inline AI Button */}
                        <button onClick={handleEnhanceEditText} disabled={isEnhancingEdit} className="absolute bottom-12 right-2 p-1.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors" title="Améliorer le texte (IA)">
                            <Wand2 className={`w-4 h-4 ${isEnhancingEdit ? 'animate-spin' : ''}`} />
                        </button>
                        
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-sm rounded hover:opacity-80" style={{ backgroundColor: theme.inputBg, color: theme.textSecondary }}>Annuler</button>
                            <button onClick={handleSaveEditPost} className="px-3 py-1.5 text-sm font-bold rounded hover:opacity-80 flex items-center gap-1" style={{ backgroundColor: theme.accent, color: '#fff' }}>
                                <Save className="w-3 h-3" /> Enregistrer
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="mb-3 whitespace-pre-line leading-relaxed" style={{ color: theme.textPrimary }}>{post.text}</p>
                )}

                {post.image && (
                    <img 
                        src={post.image} 
                        className="w-full h-auto max-h-[500px] object-cover rounded-lg mb-3 border" 
                        style={{ borderColor: theme.border }}
                        loading="lazy"
                    />
                )}

                <div className="flex justify-between px-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                    <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 font-medium py-2 px-4 hover:bg-gray-200/10 rounded-lg transition-colors`} style={{ color: post.isLiked ? theme.accent : theme.textSecondary }}>
                        <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-2 font-medium py-2 px-4 hover:bg-gray-200/10 rounded-lg transition-colors" style={{ color: theme.textSecondary }}>
                        <MessageSquare className="w-5 h-5" /> {post.comments.length}
                    </button>
                    <button onClick={handleSharePost} className="flex items-center gap-2 font-medium py-2 px-4 hover:bg-gray-200/10 rounded-lg transition-colors" style={{ color: theme.textSecondary }}>
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 w-full backdrop-blur-lg border-t flex justify-around items-center h-16 z-50 transition-colors" 
           style={{ backgroundColor: `${theme.bgPanel}EE`, borderColor: theme.border }}>
        <button className="p-2 flex flex-col items-center group" style={{ color: theme.accent }}>
            <Home className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
            <div className="w-1 h-1 rounded-full mt-1" style={{ backgroundColor: theme.accent }}></div>
        </button>
        <button className="p-2 flex flex-col items-center" style={{ color: theme.textSecondary }}>
            <Bell className="w-6 h-6" />
        </button>
        
        <button 
            onClick={onBackToChat}
            className="relative -top-5 p-1 rounded-full shadow-lg transition-transform hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.textPrimary})` }}
        >
            <div className="p-3 rounded-full border" style={{ backgroundColor: theme.bgPanel, borderColor: theme.accent }}>
                 <MessageCircle className="w-7 h-7" style={{ color: theme.textPrimary }} />
            </div>
        </button>

        <button className="p-2 flex flex-col items-center" style={{ color: theme.textSecondary }}>
            <div className="w-6 h-6 rounded-full overflow-hidden border" style={{ borderColor: theme.border }}>
                 <img src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`} className="w-full h-full object-cover" />
            </div>
        </button>
        <button className="p-2 flex flex-col items-center" style={{ color: theme.textSecondary }}>
            <Menu className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};