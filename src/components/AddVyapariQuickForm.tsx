// src/components/AddVyapariQuickForm.tsx
'use client';

import React, { useState } from 'react';
import { Vyapari } from '@/types'; // Ensure this import is correct
import * as firestoreService from '@/lib/firebase/firestoreService';
import { getAuth } from 'firebase/auth';

interface AddVyapariQuickFormProps {
  onSuccess: (newVyapariId: string) => void;
  onCancel: () => void;
}

const AddVyapariQuickForm: React.FC<AddVyapariQuickFormProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [city, setCity] = useState<string>(''); // This state is for the 'City' input
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError('Vyapari Name is required.');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Prepare data for the Vyapari object, ensuring null for empty optional strings
      const newVyapariData: Omit<Vyapari, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        contactNumber: contactNumber.trim() === '' ? null : contactNumber.trim(),
        // Map 'city' input to 'address' field in Vyapari interface, or 'village' based on your preference
        address: city.trim() === '' ? null : city.trim(), // Assuming 'city' maps to 'address'
        // If you meant for 'city' to be 'village', change 'address' to 'village' here.
        // If you want a dedicated 'city' field in Vyapari, add `city?: string | null;` to your Vyapari type in types/index.ts first.
        registeredByRef: currentUser.uid,
        hasWhatsapp: true, // Default to true as per your interface
        isWhatsappSameAsContact: true, // Default to true as per your interface
        // No whatsappNumber needed if isWhatsappSameAsContact is true
      };

      const newVyapariId = await firestoreService.addVyapari(newVyapariData);
      onSuccess(newVyapariId);
    } catch (err: any) {
      console.error('Error adding Vyapari:', err);
      setError(`Failed to add Vyapari: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label htmlFor="vyapariName" className="block text-sm font-medium text-gray-700">
          Vyapari Name *
        </label>
        <input
          type="text"
          id="vyapariName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="vyapariContact" className="block text-sm font-medium text-gray-700">
          Contact Number (Optional)
        </label>
        <input
          type="text"
          id="vyapariContact"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="vyapariCity" className="block text-sm font-medium text-gray-700">
          City (Optional)
        </label>
        <input
          type="text"
          id="vyapariCity"
          value={city}
          onChange={(e) => setCity(e.target.value)}
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
          {loading ? 'Adding...' : 'Add Vyapari'}
        </button>
      </div>
    </form>
  );
};

export default AddVyapariQuickForm;