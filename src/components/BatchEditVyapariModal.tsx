// src/components/BatchEditVyapariModal.tsx
import React, { useState, useCallback } from 'react';
import Modal from '@/components/Modal'; // Assuming your generic Modal component
import * as firestoreService from '@/lib/firebase/firestoreService';
import { Vyapari } from '@/types';

interface BatchEditVyapariModalProps {
  isOpen: boolean;
  onClose: () => void;
  vyapariIds: string[]; // IDs of Vyaparis to be batch edited
  onBatchEditComplete: () => void; // Callback to refresh the list after edit
}

const BatchEditVyapariModal: React.FC<BatchEditVyapariModalProps> = ({ isOpen, onClose, vyapariIds, onBatchEditComplete }) => {
  const [formData, setFormData] = useState<Partial<Omit<Vyapari, 'id' | 'createdAt' | 'updatedAt'>>>({
    contactNumber: '',
    city: '',
    address: '',
    notes: '',
    gstNumber: '',
    hasWhatsapp: undefined, // Use undefined for checkboxes to indicate "no change"
    isWhatsappSameAsContact: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset form when modal opens or vyapariIds change
  React.useEffect(() => {
    setFormData({
      contactNumber: '',
      city: '',
      address: '',
      notes: '',
      gstNumber: '',
      hasWhatsapp: undefined,
      isWhatsappSameAsContact: undefined,
    });
    setSubmitMessage(null);
  }, [isOpen, vyapariIds]);


  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setFormData(prev => {
      if (type === 'checkbox') {
        // For checkboxes, we want to store true/false/undefined (undefined means no change)
        return { ...prev, [name]: checked };
      }
      // For text/select inputs, if value is empty, store as undefined to not update the field
      return { ...prev, [name]: value === '' ? undefined : value };
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Filter out undefined values from formData to only send fields that were explicitly changed
    const updates: Partial<Omit<Vyapari, 'id' | 'createdAt' | 'updatedAt'>> = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== undefined && value !== '')
    ) as Partial<Omit<Vyapari, 'id' | 'createdAt' | 'updatedAt'>>;

    if (Object.keys(updates).length === 0) {
      setSubmitMessage({ type: 'error', text: 'No changes detected to apply.' });
      setIsSubmitting(false);
      return;
    }

    try {
      await firestoreService.batchUpdateVyaparis(vyapariIds, updates);
      setSubmitMessage({ type: 'success', text: `Successfully updated ${vyapariIds.length} Vyaparis.` });
      // Call the callback to refresh the parent list
      onBatchEditComplete();
      // Close modal after a short delay
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error("Error batch updating Vyaparis:", err);
      setSubmitMessage({ type: 'error', text: `Failed to batch update Vyaparis: ${err.message || 'An unknown error occurred.'}` });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, vyapariIds, onClose, onBatchEditComplete]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Batch Edit ${vyapariIds.length} Vyaparis`}>
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
          Enter values for the fields you want to update. Only fields with a value will be applied to all selected Vyaparis.
          Leave a field blank if you do not wish to change it.
        </p>

        {/* Contact Number */}
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            type="text"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          />
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            value={formData.address || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* GST Number */}
        <div>
          <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
            GST Number
          </label>
          <input
            type="text"
            id="gstNumber"
            name="gstNumber"
            value={formData.gstNumber || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={isSubmitting}
          />
        </div>

        {/* hasWhatsapp */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasWhatsapp"
            name="hasWhatsapp"
            checked={formData.hasWhatsapp === true} // Only check if explicitly true
            onChange={handleFormChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="hasWhatsapp" className="ml-2 block text-sm font-medium text-gray-700">
            Has WhatsApp (Check to set true, Uncheck to set false, leave untouched for no change)
          </label>
        </div>

        {/* isWhatsappSameAsContact */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isWhatsappSameAsContact"
            name="isWhatsappSameAsContact"
            checked={formData.isWhatsappSameAsContact === true}
            onChange={handleFormChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="isWhatsappSameAsContact" className="ml-2 block text-sm font-medium text-gray-700">
            WhatsApp Same as Contact (Check to set true, Uncheck to set false, leave untouched for no change)
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

export default BatchEditVyapariModal;
