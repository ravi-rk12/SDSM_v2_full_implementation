// src/app/dashboard/vyaparis/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Vyapari, BillStatement } from "@/types"; // Import BillStatement
import Modal from '@/components/Modal'; // Assuming you have a generic Modal component
import BillModal from '@/components/BillModal'; // Import the BillModal
import BatchEditVyapariModal from '@/components/BatchEditVyapariModal'; // NEW: Import BatchEditVyapariModal

export default function VyaparisPage() {
  const router = useRouter();
  const [vyaparis, setVyaparis] = useState<Vyapari[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

  // State for Vyapari detail modal
  const [showVyapariModal, setShowVyapariModal] = useState(false);
  const [selectedVyapari, setSelectedVyapari] = useState<Vyapari | null>(null);

  // State for Bill Modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [billData, setBillData] = useState<BillStatement | null>(null);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  // NEW: State for Batch Edit
  const [selectedVyapariIds, setSelectedVyapariIds] = useState<string[]>([]);
  const [showBatchEditVyapariModal, setShowBatchEditVyapariModal] = useState(false);


  const fetchVyaparis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedVyaparis = await firestoreService.getVyaparis();
      setVyaparis(fetchedVyaparis);
      setSelectedVyapariIds([]); // Clear selections on data refresh
    } catch (err: any) {
      console.error("Error fetching Vyaparis:", err);
      setError(
        `Failed to load Vyaparis: ${err.message || "An unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVyaparis();
  }, [fetchVyaparis]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete Vyapari "${name}"? This action cannot be undone.`)) {
      setIsDeleting(true); // Indicate that a delete operation is in progress
      try {
        await firestoreService.deleteVyapari(id);
        setVyaparis(vyaparis.filter((vyapari) => vyapari.id !== id));
      } catch (err: any) {
        console.error("Error deleting Vyapari:", err);
        setError(`Failed to delete Vyapari: ${err.message || "An unknown error occurred."}`);
      } finally {
        setIsDeleting(false); // Reset delete state
      }
    }
  };

  const handleViewDetails = (vyapari: Vyapari) => {
    setSelectedVyapari(vyapari);
    setShowVyapariModal(true);
  };

  const handleGenerateBill = async (vyapariId: string) => {
    setIsGeneratingBill(true);
    setBillError(null);
    setBillData(null); // Clear previous bill data

    try {
      // For a Vyapari bill, entityType is 'vyapari'
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

      const statement = await firestoreService.getBillStatement({
        entityType: 'vyapari',
        entityId: vyapariId,
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

  const renderVyapariModal = () => {
    if (!selectedVyapari) return null;
    return (
      <Modal
        isOpen={showVyapariModal}
        onClose={() => setShowVyapariModal(false)}
        title={`Vyapari Details: ${selectedVyapari.name}`}
      >
        <div className="space-y-3 p-4">
          <p><strong>City:</strong> {selectedVyapari.city || 'N/A'}</p>
          <p><strong>Contact:</strong> {selectedVyapari.contactNumber || 'N/A'}</p>
          <p><strong>GSTIN:</strong> {selectedVyapari.gstNumber || 'N/A'}</p>
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

  // NEW: Handle checkbox selection
  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedVyapariIds(prev => [...prev, id]);
    } else {
      setSelectedVyapariIds(prev => prev.filter(vyapariId => vyapariId !== id));
    }
  };

  // NEW: Handle select all checkbox
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVyapariIds(vyaparis.map(vyapari => vyapari.id));
    } else {
      setSelectedVyapariIds([]);
    }
  };

  // NEW: Open Batch Edit Modal
  const handleOpenBatchEditModal = () => {
    if (selectedVyapariIds.length > 0) {
      setShowBatchEditVyapariModal(true);
    }
  };

  // NEW: Callback for when batch edit is complete (to refresh list)
  const handleBatchEditComplete = () => {
    setShowBatchEditVyapariModal(false);
    fetchVyaparis(); // Re-fetch all vyaparis to reflect changes
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-full">
        <p className="text-xl text-gray-700">Loading Vyaparis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchVyaparis}
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
        <h1 className="text-3xl font-bold text-gray-800">Vyaparis</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleOpenBatchEditModal}
            disabled={selectedVyapariIds.length === 0}
            className={`px-4 py-2 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedVyapariIds.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
            }`}
          >
            Batch Edit ({selectedVyapariIds.length})
          </button>
          <Link href="/dashboard/vyaparis/add" passHref>
            <button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Add New Vyapari
            </button>
          </Link>
        </div>
      </div>

      {billError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {billError}
        </div>
      )}

      {vyaparis.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4 text-lg">No Vyaparis found. Add your first Vyapari!</p>
          <Link href="/dashboard/vyaparis/add">
            <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Add First Vyapari
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
                    checked={selectedVyapariIds.length === vyaparis.length && vyaparis.length > 0}
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
                  City
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
              {vyaparis.map((vyapari) => (
                <tr key={vyapari.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedVyapariIds.includes(vyapari.id)}
                      onChange={(e) => handleCheckboxChange(vyapari.id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vyapari.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vyapari.contactNumber || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vyapari.city || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-semibold ${
                        (vyapari.bakaya || 0) < 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{(vyapari.bakaya || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(vyapari)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View / Edit
                    </button>
                    <button
                      onClick={() => handleGenerateBill(vyapari.id)}
                      className="text-teal-600 hover:text-teal-900 mr-4"
                      disabled={isGeneratingBill}
                    >
                      {isGeneratingBill ? 'Generating...' : 'Print Bill'}
                    </button>
                    <button
                      onClick={() => handleDelete(vyapari.id, vyapari.name)}
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

      {/* Vyapari Details Modal */}
      {renderVyapariModal()}

      {/* Bill Modal */}
      {showBillModal && billData && (
        <BillModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          billData={billData}
        />
      )}

      {/* NEW: Batch Edit Vyapari Modal */}
      {showBatchEditVyapariModal && (
        <BatchEditVyapariModal
          isOpen={showBatchEditVyapariModal}
          onClose={() => setShowBatchEditVyapariModal(false)}
          vyapariIds={selectedVyapariIds}
          onBatchEditComplete={handleBatchEditComplete}
        />
      )}
    </div>
  );
}
