import React, { useState } from 'react';
import { X, ShieldCheck, Lock, User, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Passcode (Priority)
    if (passcode === 'yahadmin' || passcode === '84268520yah2026') {
      onLoginSuccess();
      resetForm();
      return;
    }

    // Check Credentials
    if (username === 'YAH-2026' && password === '84268520yah2026') {
      onLoginSuccess();
      resetForm();
      return;
    }

    // If neither worked
    if (passcode || (username && password)) {
        setError('Code ou identifiants incorrects');
    }
  };

  const resetForm = () => {
      setUsername('');
      setPassword('');
      setPasscode('');
      setError('');
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-fade-in">
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-5 h-5 text-[#00a884]" />
            <h2 className="text-lg font-semibold tracking-wide">Espace Admin</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleLogin} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}
          
          {/* Section 1: Username & Password */}
          <div className="space-y-3 mb-6">
             <div className="flex items-center gap-2 mb-2">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase">Connexion Classique</span>
                <div className="h-px bg-gray-200 flex-1"></div>
             </div>

             <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                  placeholder="Identifiant (YAH-2026)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
             </div>
             
             <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
             </div>
          </div>

          {/* Section 2: Passcode (Quick Access) */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="flex items-center gap-2 mb-3 justify-center">
                <KeyRound className="w-4 h-4 text-[#00a884]" />
                <span className="text-xs font-bold text-[#00a884] uppercase tracking-wider">Accès Rapide</span>
             </div>

             <input
                type="password"
                className="w-full text-center px-4 py-3 border-2 border-[#00a884]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all font-bold tracking-widest text-lg bg-white"
                placeholder="CODE D'ACCÈS"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
             />
             <p className="text-[10px] text-gray-400 text-center mt-2">Entrez 'yahadmin' pour déverrouiller</p>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black transition-all shadow-lg active:scale-95"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};