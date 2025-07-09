// src/app/dashboard/transactions/[transactionId]/page.tsx
'use client'; // This component is a Client Component

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as firestoreService from '@/lib/firebase/firestoreService';
import { Transaction, Kisan, Vyapari } from '@/types'; // Import Kisan and Vyapari types

// Assuming a Modal component is available at @/components/Modal
import Modal from '@/components/Modal';

// --- Conceptual Tooltip Component (Replace with actual if using a library like Shadcn) ---
const CustomTooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer" // Indicate it's interactive
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 p-2 text-sm text-white bg-gray-800 rounded-md shadow-lg -translate-y-full top-0 left-1/2 -translate-x-1/2 min-w-max">
          {content}
        </div>
      )}
    </div>
  );
};
// --------------------------------------------------------------------------------------

// Added the missing interface definition
interface TransactionDetailPageProps {
  params: {
    transactionId: string;
  };
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { transactionId } = params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [kisanDetails, setKisanDetails] = useState<Kisan | null>(null); // State for Kisan full details
  const [vyapariDetails, setVyapariDetails] = useState<Vyapari | null>(null); // State for Vyapari full details
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for modals
  const [showKisanModal, setShowKisanModal] = useState(false);
  const [showVyapariModal, setShowVyapariModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (transactionId) {
      const fetchTransactionAndRelatedData = async () => {
        try {
          setIsLoading(true);
          const fetchedTransaction = await firestoreService.getTransactionById(transactionId);

          if (fetchedTransaction) {
            setTransaction(fetchedTransaction);

            // Fetch Kisan and Vyapari details concurrently
            const [kisanData, vyapariData] = await Promise.all([
              fetchedTransaction.kisanRef
                ? firestoreService.getKisanById(fetchedTransaction.kisanRef)
                : Promise.resolve(null),
              fetchedTransaction.vyapariRef
                ? firestoreService.getVyapariById(fetchedTransaction.vyapariRef)
                : Promise.resolve(null),
            ]);
            setKisanDetails(kisanData);
            setVyapariDetails(vyapariData);
          } else {
            setError('Transaction not found.');
          }
        } catch (err: any) {
          console.error('Error fetching data:', err);
          setError(`Failed to load data: ${err.message || 'An unknown error occurred'}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransactionAndRelatedData();
    }
  }, [transactionId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Loading Transaction Details...</h1>
        <p>Fetching transaction data for ID: {transactionId}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Transaction Not Found</h1>
        <p>No transaction found with ID: {transactionId}.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --- Render logic for Kisan/Vyapari Modals ---
  const renderKisanModal = () => {
    if (!kisanDetails) return null;
    return (
      <Modal
        isOpen={showKisanModal}
        onClose={() => setShowKisanModal(false)}
        title={`Kisan Details: ${kisanDetails.name}`}
      >
        <div className="space-y-3 p-4">
          <p><strong>Village:</strong> {kisanDetails.village}</p>
          <p><strong>Contact:</strong> {kisanDetails.contactNumber}</p>
          {/* Corrected access for bankAccountDetails */}
          <p>
            <strong>Bank Account:</strong>{" "}
            {kisanDetails.bankAccountDetails?.accountNumber || 'N/A'}
            {kisanDetails.bankAccountDetails?.ifscCode ? ` (IFSC: ${kisanDetails.bankAccountDetails.ifscCode})` : ''}
          </p>
          <p><strong>Aadhaar No:</strong> {kisanDetails.aadhaarNumber || 'N/A'}</p>
          <p className="font-bold text-lg"><strong>Current Bakaya:</strong> ₹{kisanDetails.bakaya?.toFixed(2) || '0.00'}</p>
          {/* Add more details as needed */}
          <button
            onClick={() => setShowKisanModal(false)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  };

  const renderVyapariModal = () => {
    if (!vyapariDetails) return null;
    return (
      <Modal
        isOpen={showVyapariModal}
        onClose={() => setShowVyapariModal(false)}
        title={`Vyapari Details: ${vyapariDetails.name}`}
      >
        <div className="space-y-3 p-4">
          <p><strong>City:</strong> {vyapariDetails.city}</p>
          <p><strong>Contact:</strong> {vyapariDetails.contactNumber}</p>
          {/* Removed GSTIN display due to type error. Add 'gstin?: string;' to your Vyapari type if needed. */}
          {/* <p><strong>GSTIN:</strong> {vyapariDetails.gstin || 'N/A'}</p> */}
          <p className="font-bold text-lg"><strong>Current Bakaya:</strong> ₹{vyapariDetails.bakaya?.toFixed(2) || '0.00'}</p>
          {/* Add more details as needed */}
          <button
            onClick={() => setShowVyapariModal(false)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Details for #{transaction.id}</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Basic Information</h2>
        <p className="mb-2">
          <span className="font-medium">Kisan:</span>{' '}
          {kisanDetails ? (
            <CustomTooltip
              content={
                <div className="text-center">
                  <p className="font-bold">{kisanDetails.name}</p>
                  <p>Village: {kisanDetails.village}</p>
                  <p>Contact: {kisanDetails.contactNumber}</p>
                  <p>Bakaya: ₹{kisanDetails.bakaya?.toFixed(2) || '0.00'}</p>
                </div>
              }
            >
              <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => setShowKisanModal(true)}>
                {transaction.kisanName}
              </span>
            </CustomTooltip>
          ) : (
            <span>{transaction.kisanName}</span>
          )}
        </p>
        <p className="mb-2">
          <span className="font-medium">Vyapari:</span>{' '}
          {vyapariDetails ? (
            <CustomTooltip
              content={
                <div className="text-center">
                  <p className="font-bold">{vyapariDetails.name}</p>
                  <p>City: {vyapariDetails.city}</p>
                  <p>Contact: {vyapariDetails.contactNumber}</p>
                  <p>Bakaya: ₹{vyapariDetails.bakaya?.toFixed(2) || '0.00'}</p>
                </div>
              }
            >
              <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => setShowVyapariModal(true)}>
                {transaction.vyapariName}
              </span>
            </CustomTooltip>
          ) : (
            <span>{transaction.vyapariName}</span>
          )}
        </p>
        <p className="mb-2">
          <span className="font-medium">Date:</span>{" "}
          {(transaction.transactionDate as Date).toLocaleDateString()}
        </p>
        <p className="mb-2">
            <span className="font-medium">Mandi Region:</span>{" "}
            {transaction.mandiRegion || 'N/A'} {/* Added || 'N/A' to handle potentially missing data */}
        </p>
        <p className="mb-2"><span className="font-medium">Recorded By:</span> {transaction.recordedByRef}</p>
        <p className="mb-2"><span className="font-medium">Status:</span> {transaction.status}</p>
        <p className="mb-2"><span className="font-medium">Notes:</span> {transaction.notes || 'N/A'}</p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Items</h2>
        {transaction.items && transaction.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity (Kg)</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price (₹/Kg)</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b border-gray-200">{item.productName}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{item.quantity.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-200">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-200">₹{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No items recorded for this transaction.</p>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Summary & Commissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="mb-2"><span className="font-medium">Sub Total:</span> ₹{transaction.subTotal.toFixed(2)}</p>
            <p className="mb-2"><span className="font-medium">Total Weight:</span> {transaction.totalWeightInKg.toFixed(2)} Kg</p>
          </div>
          <div>
            <p className="mb-2"><span className="font-medium">Kisan Commission ({transaction.commissionKisanRate * 100}%):</span> ₹{transaction.commissionKisanAmount.toFixed(2)}</p>
            <p className="mb-2"><span className="font-medium">Vyapari Commission (₹{transaction.commissionVyapariRatePerKg.toFixed(2)}/Kg):</span> ₹{transaction.commissionVyapariAmount.toFixed(2)}</p>
            <p className="mb-2 font-bold"><span className="font-medium">Total Commission:</span> ₹{transaction.totalCommission.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-lg font-bold text-green-700"><span className="font-medium">Net Amount to Kisan:</span> ₹{transaction.netAmountKisan.toFixed(2)}</p>
          <p className="text-lg font-bold text-blue-700"><span className="font-medium">Net Amount from Vyapari:</span> ₹{transaction.netAmountVyapari.toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={() => router.back()}
        className="mt-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        Back to All Transactions
      </button>

      {/* Render Modals */}
      {renderKisanModal()}
      {renderVyapariModal()}
    </div>
  );
}