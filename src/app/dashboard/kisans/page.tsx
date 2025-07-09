// src/app/dashboard/kisans/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Kisan, BillStatement } from "@/types"; // Import BillStatement
import Modal from '@/components/Modal'; // Assuming you have a generic Modal component
import BillModal from '@/components/BillModal'; // Import the BillModal
import BatchEditKisanModal from '@/components/BatchEditKisanModal'; // NEW: Import BatchEditKisanModal

export default function KisansPage() {
  const router = useRouter();
  const [kisans, setKisans] = useState<Kisan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

  // State for Kisan detail modal
  const [showKisanModal, setShowKisanModal] = useState(false);
  const [selectedKisan, setSelectedKisan] = useState<Kisan | null>(null);

  // State for Bill Modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [billData, setBillData] = useState<BillStatement | null>(null);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  // NEW: State for Batch Edit
  const [selectedKisanIds, setSelectedKisanIds] = useState<string[]>([]);
  const [showBatchEditKisanModal, setShowBatchEditKisanModal] = useState(false);


  const fetchKisans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedKisans = await firestoreService.getKisans();
      setKisans(fetchedKisans);
      setSelectedKisanIds([]); // Clear selections on data refresh
    } catch (err: any) {
      console.error("Error fetching Kisans:", err);
      setError(
        `Failed to load Kisans: ${err.message || "An unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKisans();
  }, [fetchKisans]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete Kisan "${name}"? This action cannot be undone.`)) {
      setIsDeleting(true); // Indicate that a delete operation is in progress
      try {
        await firestoreService.deleteKisan(id);
        setKisans(kisans.filter((kisan) => kisan.id !== id));
      } catch (err: any) {
        console.error("Error deleting Kisan:", err);
        setError(`Failed to delete Kisan: ${err.message || "An unknown error occurred."}`);
      } finally {
        setIsDeleting(false); // Reset delete state
      }
    }
  };

  const handleViewDetails = (kisan: Kisan) => {
    setSelectedKisan(kisan);
    setShowKisanModal(true);
  };

  const handleGenerateBill = async (kisanId: string) => {
    setIsGeneratingBill(true);
    setBillError(null);
    setBillData(null); // Clear previous bill data

    try {
      // For a Kisan bill, entityType is 'kisan'
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

      const statement = await firestoreService.getBillStatement({
        entityType: 'kisan',
        entityId: kisanId,
        startDate: oneYearAgo, // Example: last year's data
        endDate: today,
      });
      setBillData(statement);
      setShowBillModal(true);
    } catch (err: any) {
      console.error("Error generating bill:", err);
      setBillError(`Failed to generate bill: ${err.message || "An unknown error occurred."}`);
    } finally {
      setIsGeneratingBill(false);
    }
  };

  const renderKisanModal = () => {
    if (!selectedKisan) return null;
    return (
      <Modal
        isOpen={showKisanModal}
        onClose={() => setShowKisanModal(false)}
        title={`Kisan Details: ${selectedKisan.name}`}
      >
        <div className="space-y-3 p-4">
          <p><strong>Village:</strong> {selectedKisan.village || 'N/A'}</p>
          <p><strong>Contact:</strong> {selectedKisan.contactNumber || 'N/A'}</p>
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

  // NEW: Handle checkbox selection
  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedKisanIds(prev => [...prev, id]);
    } else {
      setSelectedKisanIds(prev => prev.filter(kisanId => kisanId !== id));
    }
  };

  // NEW: Handle select all checkbox
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedKisanIds(kisans.map(kisan => kisan.id));
    } else {
      setSelectedKisanIds([]);
    }
  };

  // NEW: Open Batch Edit Modal
  const handleOpenBatchEditModal = () => {
    if (selectedKisanIds.length > 0) {
      setShowBatchEditKisanModal(true);
    }
  };

  // NEW: Callback for when batch edit is complete (to refresh list)
  const handleBatchEditComplete = () => {
    setShowBatchEditKisanModal(false);
    fetchKisans(); // Re-fetch all kisans to reflect changes
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-full">
        <p className="text-xl text-gray-700">Loading Kisans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchKisans}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kisans</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleOpenBatchEditModal}
            disabled={selectedKisanIds.length === 0}
            className={`px-4 py-2 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedKisanIds.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
            }`}
          >
            Batch Edit ({selectedKisanIds.length})
          </button>
          <Link href="/dashboard/kisans/add" passHref>
            <button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Add New Kisan
            </button>
          </Link>
        </div>
      </div>

      {billError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {billError}
        </div>
      )}

      {kisans.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4 text-lg">No Kisans found. Add your first Kisan!</p>
          <Link href="/dashboard/kisans/add">
            <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Add First Kisan
            </button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={handleSelectAllChange}
                    checked={selectedKisanIds.length === kisans.length && kisans.length > 0}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Contact
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Village
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Outstanding (₹)
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
              {kisans.map((kisan) => (
                <tr key={kisan.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedKisanIds.includes(kisan.id)}
                      onChange={(e) => handleCheckboxChange(kisan.id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {kisan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kisan.contactNumber || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kisan.village || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-semibold ${
                        (kisan.bakaya || 0) < 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{(kisan.bakaya || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(kisan)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View / Edit
                    </button>
                    <button
                      onClick={() => handleGenerateBill(kisan.id)}
                      className="text-teal-600 hover:text-teal-900 mr-4"
                      disabled={isGeneratingBill}
                    >
                      {isGeneratingBill ? 'Generating...' : 'Print Bill'}
                    </button>
                    <button
                      onClick={() => handleDelete(kisan.id, kisan.name)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kisan Details Modal */}
      {renderKisanModal()}

      {/* Bill Modal */}
      {showBillModal && billData && (
        <BillModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          billData={billData}
        />
      )}

      {/* NEW: Batch Edit Kisan Modal */}
      {showBatchEditKisanModal && (
        <BatchEditKisanModal
          isOpen={showBatchEditKisanModal}
          onClose={() => setShowBatchEditKisanModal(false)}
          kisanIds={selectedKisanIds}
          onBatchEditComplete={handleBatchEditComplete}
        />
      )}
    </div>
  );
}
