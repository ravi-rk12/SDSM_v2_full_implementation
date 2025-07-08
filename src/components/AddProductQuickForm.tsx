// src/components/AddProductQuickForm.tsx
'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import * as firestoreService from '@/lib/firebase/firestoreService';
import { getAuth } from 'firebase/auth';

interface AddProductQuickFormProps {
  onSuccess: (newProductId: string) => void;
  onCancel: () => void;
}

const AddProductQuickForm: React.FC<AddProductQuickFormProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('kg'); // Default to 'kg'
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      setLoading(false);
      return;
    }
    if (!unit.trim()) {
      setError('Product Unit is required.');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in.');
      }

      const newProductData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        unit: unit.trim(),
        active: true, // New products are active by default
      };

      const newProductId = await firestoreService.addProduct(newProductData);
      onSuccess(newProductId);
    } catch (err: any) {
      console.error('Error adding Product:', err);
      setError(`Failed to add Product: ${err.message || 'An unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
          Product Name *
        </label>
        <input
          type="text"
          id="productName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="productUnit" className="block text-sm font-medium text-gray-700">
          Unit * (e.g., kg, quintal, bag)
        </label>
        <input
          type="text"
          id="productUnit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
          required
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
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default AddProductQuickForm;