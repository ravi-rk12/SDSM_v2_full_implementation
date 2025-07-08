// src/app/dashboard/transactions/[transactionId]/page.tsx
'use client'; // This component is a Client Component

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as firestoreService from '@/lib/firebase/firestoreService';
import { Transaction } from '@/types';

interface TransactionDetailPageProps {
  params: {
    transactionId: string;
  };
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  // Correct way to access params in a Client Component: direct destructuring
  const { transactionId } = params; 

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter(); 

  useEffect(() => {
    if (transactionId) {
      const fetchTransaction = async () => {
        try {
          setIsLoading(true);
          const fetchedTransaction = await firestoreService.getTransactionById(transactionId);
          if (fetchedTransaction) {
            setTransaction(fetchedTransaction);
          } else {
            setError('Transaction not found.');
          }
        } catch (err: any) {
          console.error('Error fetching transaction:', err);
          setError(`Failed to load transaction: ${err.message || 'An unknown error occurred'}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransaction();
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Details for #{transaction.id}</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Basic Information</h2>
        <p className="mb-2"><span className="font-medium">Kisan:</span> {transaction.kisanName}</p>
        <p className="mb-2"><span className="font-medium">Vyapari:</span> {transaction.vyapariName}</p>
        <p className="mb-2">
          <span className="font-medium">Date:</span>{" "}
          {(transaction.transactionDate as Date).toLocaleDateString()}{/* Applied type assertion here */}
        </p>
        <p className="mb-2"><span className="font-medium">Mandi Region:</span> {transaction.mandiRegion}</p>
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
    </div>
  );
}