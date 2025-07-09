// src/components/BatchEditProductModal.tsx
import React, { useState, useCallback } from 'react';
import Modal from '@/components/Modal'; // Assuming your generic Modal component
import * as firestoreService from '@/lib/firebase/firestoreService';
import { Product } from '@/types';

interface BatchEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productIds: string[]; // IDs of Products to be batch edited
  onBatchEditComplete: () => void; // Callback to refresh the list after edit
}

const BatchEditProductModal: React.FC<BatchEditProductModalProps> = ({ isOpen, onClose, productIds, onBatchEditComplete }) => {
  const [formData, setFormData] = useState<Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>>({
    name: '',
    unit: '', // Assuming unit can be batch edited, though it's 'kg' by default
    category: '',
    description: '',
    defaultUnitPrice: undefined, // Use undefined for numbers to indicate "no change"
    active: undefined, // Use undefined for checkboxes to indicate "no change"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset form when modal opens or productIds change
  React.useEffect(() => {
    setFormData({
      name: '',
      unit: '',
      category: '',
      description: '',
      defaultUnitPrice: undefined,
      active: undefined,
    });
    setSubmitMessage(null);
  }, [isOpen, productIds]);


  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setFormData(prev => {
      if (type === 'checkbox') {
        return { ...prev, [name]: checked };
      } else if (type === 'number') {
        // Parse float, if empty string, set to undefined
        return { ...prev, [name]: value === '' ? undefined : parseFloat(value) };
      }
      // For other inputs (text, select), if value is empty, set to undefined to not update the field
      return { ...prev, [name]: value === '' ? undefined : value };
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Filter out undefined values from formData to only send fields that were explicitly changed
    const updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== undefined && value !== '')
    ) as Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

    if (Object.keys(updates).length === 0) {
      setSubmitMessage({ type: 'error', text: 'No changes detected to apply.' });
      setIsSubmitting(false);
      return;
    }

    try {
      await firestoreService.batchUpdateProducts(productIds, updates);
      setSubmitMessage({ type: 'success', text: `Successfully updated ${productIds.length} Products.` });
      // Call the callback to refresh the parent list
      onBatchEditComplete();
      // Close modal after a short delay
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error("Error batch updating Products:", err);
      setSubmitMessage({ type: 'error', text: `Failed to batch update Products: ${err.message || 'An unknown error occurred.'}` });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, productIds, onClose, onBatchEditComplete]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Batch Edit ${productIds.length} Products`}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {submitMessage && (
          <div
            className={`p-3 rounded-md mb-4 ${
              submitMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        <p className="text-sm text-gray-600">
          Enter values for the fields you want to update. Only fields with a value will be applied to all selected Products.
          Leave a field blank if you do not wish to change it.
        </p>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          />
        </div>

        {/* Unit */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
            Unit
          </label>
          <select
            id="unit"
            name="unit"
            value={formData.unit || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
            disabled={isSubmitting}
          >
            <option value="">-- No Change --</option>
            <option value="kg">kg</option>
            {/* Add other units if applicable, e.g., <option value="quintal">Quintal</option> */}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* Default Unit Price */}
        <div>
          <label htmlFor="defaultUnitPrice" className="block text-sm font-medium text-gray-700">
            Default Unit Price (₹)
          </label>
          <input
            type="number"
            id="defaultUnitPrice"
            name="defaultUnitPrice"
            // Fix: Explicitly handle undefined or null by converting to empty string
            value={(formData.defaultUnitPrice === undefined || formData.defaultUnitPrice === null) ? '' : formData.defaultUnitPrice}
            onChange={handleFormChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            name="active"
            checked={formData.active === true} // Only check if explicitly true
            onChange={handleFormChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
            Active (Check to set true, Uncheck to set false, leave untouched for no change)
          </label>
        </div>


        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Applying Changes..." : "Apply Batch Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BatchEditProductModal;
