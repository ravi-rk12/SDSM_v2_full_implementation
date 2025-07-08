// src/components/AddKisanQuickForm.tsx
'use client';

import React, { useState } from 'react';
import { Kisan } from '@/types';
import * as firestoreService from '@/lib/firebase/firestoreService';
import { getAuth } from 'firebase/auth'; // To get the UID of the user recording the Kisan

interface AddKisanQuickFormProps {
  onSuccess: (newKisanId: string) => void;
  onCancel: () => void;
}

const AddKisanQuickForm: React.FC<AddKisanQuickFormProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError('Kisan Name is required.');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in.');
      }

      const newKisanData: Omit<Kisan, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        // FIX: Use null instead of undefined for optional fields if empty
        contactNumber: contactNumber.trim() === '' ? null : contactNumber.trim(),
        village: village.trim() === '' ? null : village.trim(),
        registeredByRef: currentUser.uid,
        hasWhatsapp: true, // Default to true for new entries
        isWhatsappSameAsContact: true, // Default to true
      };

      const newKisanId = await firestoreService.addKisan(newKisanData);
      onSuccess(newKisanId); // Pass the new ID back to the parent
    } catch (err: any) {
      console.error('Error adding Kisan:', err);
      setError(`Failed to add Kisan: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label htmlFor="kisanName" className="block text-sm font-medium text-gray-700">
          Kisan Name *
        </label>
        <input
          type="text"
          id="kisanName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="kisanContact" className="block text-sm font-medium text-gray-700">
          Contact Number (Optional)
        </label>
        <input
          type="text"
          id="kisanContact"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="kisanVillage" className="block text-sm font-medium text-gray-700">
          Village (Optional)
        </label>
        <input
          type="text"
          id="kisanVillage"
          value={village}
          onChange={(e) => setVillage(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Kisan'}
        </button>
      </div>
    </form>
  );
};

export default AddKisanQuickForm;