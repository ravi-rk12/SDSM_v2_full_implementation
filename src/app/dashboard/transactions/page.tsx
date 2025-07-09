// src/app/dashboard/transactions/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Transaction, Kisan, Vyapari, SystemSettings } from "@/types"; // Import SystemSettings
import * as firestoreService from "@/lib/firebase/firestoreService";
import Link from "next/link"; // For linking to transaction details

// Assuming a Modal component is available at @/components/Modal
import Modal from '@/components/Modal';

// --- Conceptual Tooltip Component (Replace with actual if using a library like Shadcn) ---
// This is duplicated from the previous file for self-containment,
// but in a real app, you'd make this a shared component.
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kisanMap, setKisanMap] = useState<Map<string, Kisan>>(new Map()); // Map for Kisan details by ID
  const [vyapariMap, setVyapariMap] = useState<Map<string, Vyapari>>(new Map()); // Map for Vyapari details by ID
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null); // State for system settings
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for modals
  const [showKisanModal, setShowKisanModal] = useState(false);
  const [showVyapariModal, setShowVyapariModal] = useState(false);
  const [selectedKisan, setSelectedKisan] = useState<Kisan | null>(null);
  const [selectedVyapari, setSelectedVyapari] = useState<Vyapari | null>(null);

  const router = useRouter();

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [fetchedTransactions, fetchedKisans, fetchedVyaparis, fetchedSettings] = await Promise.all([
        firestoreService.getTransactions(),
        firestoreService.getKisans(),
        firestoreService.getVyaparis(),
        firestoreService.getSystemSettings(), // Fetch system settings
      ]);

      setTransactions(fetchedTransactions);

      // Create maps for quick lookup
      const newKisanMap = new Map<string, Kisan>();
      fetchedKisans.forEach(kisan => newKisanMap.set(kisan.id, kisan));
      setKisanMap(newKisanMap);

      const newVyapariMap = new Map<string, Vyapari>();
      fetchedVyaparis.forEach(vyapari => newVyapariMap.set(vyapari.id, vyapari));
      setVyapariMap(newVyapariMap);

      setSystemSettings(fetchedSettings); // Set system settings

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(
        `Failed to load data: ${err.message || "An unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handlers for modal display
  const handleKisanClick = (kisanId: string) => {
    const kisan = kisanMap.get(kisanId);
    if (kisan) {
      setSelectedKisan(kisan);
      setShowKisanModal(true);
    }
  };

  const handleVyapariClick = (vyapariId: string) => {
    const vyapari = vyapariMap.get(vyapariId);
    if (vyapari) {
      setSelectedVyapari(vyapari);
      setShowVyapariModal(true);
    }
  };

  // --- Render logic for Kisan/Vyapari Modals (Duplicated for self-containment, but should be shared components) ---
  const renderKisanModal = () => {
    if (!selectedKisan) return null;
    return (
      <Modal
        isOpen={showKisanModal}
        onClose={() => setShowKisanModal(false)}
        title={`Kisan Details: ${selectedKisan.name}`}
      >
        <div className="space-y-3 p-4">
          <p><strong>Village:</strong> {selectedKisan.village}</p>
          <p><strong>Contact:</strong> {selectedKisan.contactNumber}</p>
          {/* Corrected access for bankAccountDetails */}
          <p>
            <strong>Bank Account:</strong>{" "}
            {selectedKisan.bankAccountDetails?.accountNumber || 'N/A'}
            {selectedKisan.bankAccountDetails?.ifscCode ? ` (IFSC: ${selectedKisan.bankAccountDetails.ifscCode})` : ''}
          </p>
          <p><strong>Aadhaar No:</strong> {selectedKisan.aadhaarNumber || 'N/A'}</p>
          <p className="font-bold text-lg"><strong>Current Bakaya:</strong> ₹{selectedKisan.bakaya?.toFixed(2) || '0.00'}</p>
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
    if (!selectedVyapari) return null;
    return (
      <Modal
        isOpen={showVyapariModal}
        onClose={() => setShowVyapariModal(false)}
        title={`Vyapari Details: ${selectedVyapari.name}`}
      >
        <div className="space-y-3 p-4">
          <p><strong>City:</strong> {selectedVyapari.city}</p>
          <p><strong>Contact:</strong> {selectedVyapari.contactNumber}</p>
          {/* Removed GSTIN display due to type error. Add 'gstin?: string;' to your Vyapari type if needed. */}
          {/* <p><strong>GSTIN:</strong> {selectedVyapari.gstin || 'N/A'}</p> */}
          <p className="font-bold text-lg"><strong>Current Bakaya:</strong> ₹{selectedVyapari.bakaya?.toFixed(2) || '0.00'}</p>
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


  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchAllData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        All Transactions
      </h1>

      {transactions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">No transactions recorded yet.</p>
          <Link href="/dashboard/transactions/add">
            <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Record Your First Transaction
            </button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kisan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Vyapari
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Weight (Kg)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Net from Vyapari
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const kisan = kisanMap.get(transaction.kisanRef);
                const vyapari = vyapariMap.get(transaction.vyapariRef);

                return (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(transaction.transactionDate as Date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {kisan ? (
                        <CustomTooltip
                          content={
                            <div className="text-center">
                              <p className="font-bold">{kisan.name}</p>
                              <p>Village: {kisan.village}</p>
                              <p>Contact: {kisan.contactNumber}</p>
                              <p>Bakaya: ₹{kisan.bakaya?.toFixed(2) || '0.00'}</p>
                            </div>
                          }
                        >
                          <span
                            className="text-blue-600 hover:underline cursor-pointer"
                            onClick={() => handleKisanClick(transaction.kisanRef)}
                          >
                            {transaction.kisanName}
                          </span>
                        </CustomTooltip>
                      ) : (
                        <span>{transaction.kisanName}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vyapari ? (
                        <CustomTooltip
                          content={
                            <div className="text-center">
                              <p className="font-bold">{vyapari.name}</p>
                              <p>City: {vyapari.city}</p>
                              <p>Contact: {vyapari.contactNumber}</p>
                              <p>Bakaya: ₹{vyapari.bakaya?.toFixed(2) || '0.00'}</p>
                            </div>
                          }
                        >
                          <span
                            className="text-blue-600 hover:underline cursor-pointer"
                            onClick={() => handleVyapariClick(transaction.vyapariRef)}
                          >
                            {transaction.vyapariName}
                          </span>
                        </CustomTooltip>
                      ) : (
                        <span>{transaction.vyapariName}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.totalWeightInKg.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{transaction.netAmountVyapari.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/transactions/${transaction.id}`}>
                        <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                          View Details
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Render Modals */}
      {renderKisanModal()}
      {renderVyapariModal()}
    </div>
  );
}