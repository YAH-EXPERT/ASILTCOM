import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, phoneNumber: string) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      setError('Please fill in all fields');
      return;
    }
    // Basic universal phone number validation regex (allows +, -, spaces, digits)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    if (!phoneRegex.test(phoneNumber)) {
        setError('Please enter a valid phone number (e.g., +1 555 123 4567)');
        return;
    }

    onSave(name, phoneNumber);
    setName('');
    setPhoneNumber('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-[#00a884] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">New Contact</h2>
          <button onClick={onClose} className="text-white hover:bg-white/10 rounded-full p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Universal Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
              placeholder="e.g. +33 6 12 34 56 78"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1, +44, +33)</p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00a884] text-white rounded-md hover:bg-[#008f6f] transition-colors shadow-sm"
            >
              Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
