
import React, { useEffect, useRef, useState } from 'react';
import { Contact, Message, ThemeColors } from '../types';
import { Send, Phone, MoreVertical, ArrowLeft, Smile } from 'lucide-react';
import { VoiceCallModal } from './VoiceCallModal';

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onVoiceMessage: (text: string, sender: 'user' | 'contact') => void;
  onBack: () => void;
  onProfileClick: () => void;
  isTyping: boolean;
  theme: ThemeColors;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  contact,
  messages,
  onSendMessage,
  onVoiceMessage,
  onBack,
  onProfileClick,
  isTyping,
  theme
}) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full relative transition-colors duration-500" style={{ backgroundColor: theme.bgChat }}>
      <VoiceCallModal 
        contact={contact}
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        onVoiceMessage={onVoiceMessage}
      />

      {/* Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
            backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
            backgroundRepeat: 'repeat',
            filter: theme.id === 'night' || theme.id === 'sifi' ? 'invert(1)' : 'none'
        }}
      />

      {/* Header */}
      <div className="p-2 flex justify-between items-center h-16 border-b z-10 transition-colors duration-300" style={{ backgroundColor: theme.inputBg, borderBottomColor: theme.border }}>
        <div className="flex items-center">
          <button onClick={onBack} className="md:hidden mr-2 p-1" style={{ color: theme.textPrimary }}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img
            src={contact.avatarUrl || `https://picsum.photos/seed/${contact.id}/200`}
            alt={contact.name}
            className="w-10 h-10 rounded-full object-cover mr-3 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={onProfileClick}
          />
          <div className="flex flex-col justify-center cursor-pointer" onClick={onProfileClick}>
            <span className="font-semibold hover:underline decoration-1 underline-offset-2" style={{ color: theme.textPrimary }}>{contact.name}</span>
            <span className="text-xs" style={{ color: theme.textSecondary }}>{isTyping ? 'typing...' : contact.phoneNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 pr-2">
          <button onClick={() => setIsVoiceCallOpen(true)} className="p-2 rounded-full transition-colors hover:opacity-80" title="Start Voice Call">
            <Phone className="w-5 h-5 cursor-pointer" style={{ color: theme.accent }} />
          </button>
          <MoreVertical className="w-5 h-5 cursor-pointer" style={{ color: theme.textSecondary }} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 z-10 space-y-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`relative max-w-[80%] md:max-w-[60%] px-2 py-1 rounded-lg shadow-sm text-sm ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                style={{ 
                    backgroundColor: isUser ? theme.bgMessageSent : theme.bgMessageReceived,
                    color: isUser && theme.id === 'futurist' ? '#fff' : theme.textPrimary
                }}
              >
                {msg.imageUrl && (
                  <div className="mb-1 rounded-lg overflow-hidden">
                    <img src={msg.imageUrl} alt="Shared" className="w-full h-auto max-h-80 object-cover" loading="lazy" />
                  </div>
                )}
                
                {msg.text && <p className={`whitespace-pre-wrap leading-relaxed ${msg.imageUrl ? 'pb-1' : 'pt-1'}`}>{msg.text}</p>}

                <div className="text-[10px] text-right pb-1 opacity-70" style={{ color: isUser && theme.id === 'futurist' ? '#fff' : theme.textSecondary }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isUser && (
                    <span className="ml-1 inline-block">
                        <svg viewBox="0 0 16 15" width="16" height="15" className="inline w-3 h-3" style={{ color: theme.id === 'futurist' ? '#fff' : theme.accent }}>
                            <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.473-.018l5.614-7.519a.41.41 0 0 0-.084-.522zm-7.668 7.476l-.605-.579a.286.286 0 0 1 .051-.433l.478-.371a.365.365 0 0 1 .51.063l.794 1.054a.172.172 0 0 1-.052.24l-1.01.523a.295.295 0 0 1-.166-.497zm-5.63-2.193l2.83 2.716a.41.41 0 0 0 .567-.018l.842-.876a.41.41 0 0 0 .036-.541L5.36 9.21a.365.365 0 0 0-.51-.063l-.478.372a.286.286 0 0 0-.05.433l.537.514-.993-.953a.418.418 0 0 0-.555.023l-.388.455a.32.32 0 0 0 .025.45l1.764 1.693z"></path>
                        </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
           <div className="flex justify-start">
             <div className="rounded-lg rounded-tl-none px-4 py-3 shadow-sm" style={{ backgroundColor: theme.bgMessageReceived }}>
               <div className="flex space-x-1">
                 <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textSecondary }}></div>
                 <div className="w-2 h-2 rounded-full animate-bounce delay-75" style={{ backgroundColor: theme.textSecondary }}></div>
                 <div className="w-2 h-2 rounded-full animate-bounce delay-150" style={{ backgroundColor: theme.textSecondary }}></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-2 z-20 flex items-center gap-2 transition-colors duration-300" style={{ backgroundColor: theme.inputBg }}>
        <Smile className="w-6 h-6 cursor-pointer hover:opacity-80" style={{ color: theme.textSecondary }} />
        <div className="flex-1 rounded-lg px-4 py-2 flex items-center transition-colors duration-300" style={{ backgroundColor: theme.bgPanel }}>
          <input
            type="text"
            className="w-full border-none focus:ring-0 text-sm bg-transparent outline-none"
            style={{ color: theme.textPrimary }}
            placeholder="Type a message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className={`p-2 rounded-full transition-colors ${inputText.trim() ? 'hover:opacity-80' : ''}`}
        >
          <Send className="w-6 h-6" style={{ color: inputText.trim() ? theme.accent : theme.textSecondary }} />
        </button>
      </div>
    </div>
  );
};
