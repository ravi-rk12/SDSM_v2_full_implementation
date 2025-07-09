// src/components/BatchEditTransactionModal.tsx
import React, { useState, useCallback } from 'react';
import Modal from '@/components/Modal'; // Assuming your generic Modal component
import * as firestoreService from '@/lib/firebase/firestoreService';
import { Transaction } from '@/types';

interface BatchEditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionIds: string[]; // IDs of Transactions to be batch edited
  onBatchEditComplete: () => void; // Callback to refresh the list after edit
}

const BatchEditTransactionModal: React.FC<BatchEditTransactionModalProps> = ({ isOpen, onClose, transactionIds, onBatchEditComplete }) => {
  const [formData, setFormData] = useState<Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'transactionDate' | 'kisanRef' | 'vyapariRef' | 'items' | 'subTotal' | 'totalWeightInKg' | 'commissionKisanRate' | 'commissionKisanAmount' | 'commissionVyapariRatePerKg' | 'commissionVyapariAmount' | 'totalCommission' | 'netAmountKisan' | 'netAmountVyapari' | 'amountPaidKisan' | 'amountPaidVyapari' | 'productRefs' | 'mandiRegion' | 'kisanName' | 'vyapariName' | 'recordedByRef'>>>(
    {
      notes: '',
      status: undefined, // Use undefined for select to indicate "no change"
      transactionType: undefined, // Use undefined for select to indicate "no change"
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset form when modal opens or transactionIds change
  React.useEffect(() => {
    setFormData({
      notes: '',
      status: undefined,
      transactionType: undefined,
    });
    setSubmitMessage(null);
  }, [isOpen, transactionIds]);


  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      // For text/select inputs, if value is empty, store as undefined to not update the field
      return { ...prev, [name]: value === '' ? undefined : value };
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Filter out undefined values from formData to only send fields that were explicitly changed
    const updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>> = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== undefined && value !== '')
    ) as Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>;

    if (Object.keys(updates).length === 0) {
      setSubmitMessage({ type: 'error', text: 'No changes detected to apply.' });
      setIsSubmitting(false);
      return;
    }

    try {
      await firestoreService.batchUpdateTransactions(transactionIds, updates);
      setSubmitMessage({ type: 'success', text: `Successfully updated ${transactionIds.length} Transactions.` });
      // Call the callback to refresh the parent list
      onBatchEditComplete();
      // Close modal after a short delay
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error("Error batch updating Transactions:", err);
      setSubmitMessage({ type: 'error', text: `Failed to batch update Transactions: ${err.message || 'An unknown error occurred.'}` });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, transactionIds, onClose, onBatchEditComplete]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Batch Edit ${transactionIds.length} Transactions`}>
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
          Enter values for the fields you want to update. Only fields with a value will be applied to all selected Transactions.
          Leave a field blank if you do not wish to change it.
        </p>

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

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
            disabled={isSubmitting}
          >
            <option value="">-- No Change --</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">
            Transaction Type
          </label>
          <select
            id="transactionType"
            name="transactionType"
            value={formData.transactionType || ''}
            onChange={handleFormChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
            disabled={isSubmitting}
          >
            <option value="">-- No Change --</option>
            <option value="sale_to_vyapari">Sale to Vyapari</option>
            <option value="purchase_from_kisan">Purchase from Kisan</option>
            <option value="return_vyapari">Return from Vyapari</option>
            <option value="return_kisan">Return to Kisan</option>
          </select>
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

export default BatchEditTransactionModal;
