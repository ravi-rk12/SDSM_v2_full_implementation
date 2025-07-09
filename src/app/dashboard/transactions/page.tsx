// src/app/dashboard/transactions/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Transaction, Kisan, Vyapari, Product, BillStatement, DailyMandiSummary } from "@/types";
import Modal from '@/components/Modal';
import BillModal from '@/components/BillModal';
import DailyMandiSummaryModal from '@/components/DailyMandiSummaryModal';
import BatchEditTransactionModal from '@/components/BatchEditTransactionModal'; // NEW: Import BatchEditTransactionModal

// --- CustomTooltip Component (keep as is) ---
const CustomTooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode }> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer"
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
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kisans, setKisans] = useState<Kisan[]>([]); // For filter dropdown
  const [vyaparis, setVyaparis] = useState<Vyapari[]>([]); // For filter dropdown
  const [products, setProducts] = useState<Product[]>([]); // For filter dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states for transaction list (keep as is)
  const [filters, setFilters] = useState({
    startDate: '', //YYYY-MM-DD format for input
    endDate: '',   //YYYY-MM-DD format for input
    selectedKisanId: '',
    selectedVyapariId: '',
    selectedProductId: '',
  });

  // Individual Bill Generation States (Modified)
  const [showBillModal, setShowBillModal] = useState(false); // For individual Kisan/Vyapari bill
  const [billType, setBillType] = useState<'kisan' | 'vyapari'>('kisan'); // Default bill type
  const [selectedBillEntityId, setSelectedBillEntityId] = useState<string>('');
  const [individualBillStartDate, setIndividualBillStartDate] = useState<string>(''); // Renamed for clarity
  const [individualBillEndDate, setIndividualBillEndDate] = useState<string>('');     // Renamed for clarity
  const [individualBillData, setIndividualBillData] = useState<BillStatement | null>(null);
  const [isGeneratingIndividualBill, setIsGeneratingIndividualBill] = useState(false);
  const [individualBillError, setIndividualBillError] = useState<string | null>(null);

  // Daily Mandi Summary States (NEW)
  const [showDailyMandiSummaryModal, setShowDailyMandiSummaryModal] = useState(false);
  const [dailyMandiSummaryDate, setDailyMandiSummaryDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [dailyMandiSummaryData, setDailyMandiSummaryData] = useState<DailyMandiSummary | null>(null);
  const [isGeneratingDailyMandiSummary, setIsGeneratingDailyMandiSummary] = useState(false);
  const [dailyMandiSummaryError, setDailyMandiSummaryError] = useState<string | null>(null);

  // States for modals (existing)
  const [showKisanModal, setShowKisanModal] = useState(false);
  const [showVyapariModal, setShowVyapariModal] = useState(false);
  const [selectedKisan, setSelectedKisan] = useState<Kisan | null>(null);
  const [selectedVyapari, setSelectedVyapari] = useState<Vyapari | null>(null);

  // NEW: State for Batch Edit Transactions
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [showBatchEditTransactionModal, setShowBatchEditTransactionModal] = useState(false);


  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch filter options (Kisans, Vyaparis, Products)
      const [fetchedKisans, fetchedVyaparis, fetchedProducts] = await Promise.all([
        firestoreService.getKisans(),
        firestoreService.getVyaparis(),
        firestoreService.getProducts(),
      ]);
      setKisans(fetchedKisans);
      setVyaparis(fetchedVyaparis);
      setProducts(fetchedProducts);

      // Set default individual bill dates (e.g., first load)
      if (!individualBillStartDate && !individualBillEndDate) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setIndividualBillStartDate(firstDayOfMonth.toISOString().split('T')[0]);
        setIndividualBillEndDate(today.toISOString().split('T')[0]);
      }


      // Prepare filters for the Firestore service call for transaction list
      const firestoreFilters: firestoreService.TransactionFilters = {};
      if (filters.startDate) {
        firestoreFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        firestoreFilters.endDate = new Date(filters.endDate);
      }
      if (filters.selectedKisanId) {
        firestoreFilters.kisanRef = filters.selectedKisanId;
      }
      if (filters.selectedVyapariId) {
        firestoreFilters.vyapariRef = filters.selectedVyapariId;
      }
      if (filters.selectedProductId) {
        firestoreFilters.productRef = filters.selectedProductId;
      }

      const fetchedTransactions = await firestoreService.getTransactions(firestoreFilters);
      setTransactions(fetchedTransactions);
      setSelectedTransactionIds([]); // Clear selections on data refresh

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(
        `Failed to load data: ${err.message || "An unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, individualBillStartDate, individualBillEndDate]); // Updated dependencies

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handlers for filter changes for transaction list (keep as is)
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchAllData(); // Trigger re-fetch with current filters
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      selectedKisanId: '',
      selectedVyapariId: '',
      selectedProductId: '',
    });
    // fetchAllData will be called due to filter state change
  };

  // Handlers for Individual Bill Generation (Modified)
  const handleIndividualBillTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBillType(e.target.value as 'kisan' | 'vyapari');
    setSelectedBillEntityId(''); // Reset entity selection when type changes
  };

  const handleIndividualBillEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBillEntityId(e.target.value);
  };

  const handleIndividualBillDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'individualBillStartDate') {
      setIndividualBillStartDate(value);
    } else {
      setIndividualBillEndDate(value);
    }
  };

  const handleGenerateIndividualBill = async () => {
    if (!selectedBillEntityId) {
      setIndividualBillError(`Please select a ${billType === 'kisan' ? 'Kisan' : 'Vyapari'} to generate a bill.`);
      return;
    }

    setIsGeneratingIndividualBill(true);
    setIndividualBillError(null);
    setIndividualBillData(null);

    try {
      // Pass startDate and endDate only if they are both provided and valid
      const statementOptions: firestoreService.GetBillStatementOptions = {
        entityType: billType,
        entityId: selectedBillEntityId,
      };

      if (individualBillStartDate && individualBillEndDate) {
          statementOptions.startDate = new Date(individualBillStartDate);
          statementOptions.endDate = new Date(individualBillEndDate);
      }

      const statement = await firestoreService.getBillStatement(statementOptions);
      setIndividualBillData(statement);
      setShowBillModal(true); // Open the individual bill modal
    } catch (err: any) {
      console.error("Error generating individual bill:", err);
      setIndividualBillError(`Failed to generate bill: ${err.message || "An unknown error occurred"}`);
    } finally {
      setIsGeneratingIndividualBill(false);
    }
  };

  // Handlers for Daily Mandi Summary (NEW)
  const handleDailyMandiSummaryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDailyMandiSummaryDate(e.target.value);
  };

  const handleGenerateDailyMandiSummary = async () => {
    if (!dailyMandiSummaryDate) {
      setDailyMandiSummaryError("Please select a date for the daily Mandi summary.");
      return;
    }

    setIsGeneratingDailyMandiSummary(true);
    setDailyMandiSummaryError(null);
    setDailyMandiSummaryData(null);

    try {
      const summary = await firestoreService.getDailyMandiSummary(new Date(dailyMandiSummaryDate));
      setDailyMandiSummaryData(summary);
      setShowDailyMandiSummaryModal(true); // Open the daily mandi summary modal
    } catch (err: any) {
      console.error("Error generating daily Mandi summary:", err);
      setDailyMandiSummaryError(`Failed to generate daily Mandi summary: ${err.message || "An unknown error occurred"}`);
    } finally {
      setIsGeneratingDailyMandiSummary(false);
    }
  };

  // Handlers for modal display (Kisan/Vyapari details) (keep as is)
  const handleKisanClick = (kisanId: string) => {
    const kisan = kisans.find(k => k.id === kisanId);
    if (kisan) {
      setSelectedKisan(kisan);
      setShowKisanModal(true);
    }
  };

  const handleVyapariClick = (vyapariId: string) => {
    const vyapari = vyaparis.find(v => v.id === vyapariId);
    if (vyapari) {
      setSelectedVyapari(vyapari);
      setShowVyapariModal(true);
    }
  };

  // Render logic for Kisan/Vyapari Modals (keep as is)
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

  // NEW: Handle checkbox selection for transactions
  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTransactionIds(prev => [...prev, id]);
    } else {
      setSelectedTransactionIds(prev => prev.filter(txnId => txnId !== id));
    }
  };

  // NEW: Handle select all checkbox for transactions
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTransactionIds(transactions.map(txn => txn.id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  // NEW: Open Batch Edit Transaction Modal
  const handleOpenBatchEditModal = () => {
    if (selectedTransactionIds.length > 0) {
      setShowBatchEditTransactionModal(true);
    }
  };

  // NEW: Callback for when batch edit is complete (to refresh list)
  const handleBatchEditComplete = () => {
    setShowBatchEditTransactionModal(false);
    fetchAllData(); // Re-fetch all transactions to reflect changes
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-full">
        <p className="text-xl text-gray-700">Loading transactions and filters...</p>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleOpenBatchEditModal}
            disabled={selectedTransactionIds.length === 0}
            className={`px-4 py-2 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedTransactionIds.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
            }`}
          >
            Batch Edit ({selectedTransactionIds.length})
          </button>
          <Link href="/dashboard/transactions/add" passHref>
            <button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Record New Transaction
            </button>
          </Link>
        </div>
      </div>

      {/* Filter Section for Transactions List (keep as is) */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Filter Transactions List</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          {/* Kisan Filter */}
          <div>
            <label htmlFor="selectedKisanId" className="block text-sm font-medium text-gray-700">
              Kisan
            </label>
            <select
              id="selectedKisanId"
              name="selectedKisanId"
              value={filters.selectedKisanId}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              <option value="">All Kisans</option>
              {kisans.map(kisan => (
                <option key={kisan.id} value={kisan.id}>{kisan.name}</option>
              ))}
            </select>
          </div>
          {/* Vyapari Filter */}
          <div>
            <label htmlFor="selectedVyapariId" className="block text-sm font-medium text-gray-700">
              Vyapari
            </label>
            <select
              id="selectedVyapariId"
              name="selectedVyapariId"
              value={filters.selectedVyapariId}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              <option value="">All Vyaparis</option>
              {vyaparis.map(vyapari => (
                <option key={vyapari.id} value={vyapari.id}>{vyapari.name}</option>
              ))}
            </select>
          </div>
          {/* Product Filter */}
          <div>
            <label htmlFor="selectedProductId" className="block text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              id="selectedProductId"
              name="selectedProductId"
              value={filters.selectedProductId}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Individual Bill Generation Section (Modified) */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Generate Individual Bill/Statement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Bill Type */}
          <div>
            <label htmlFor="billType" className="block text-sm font-medium text-gray-700">
              Bill For
            </label>
            <select
              id="billType"
              name="billType"
              value={billType}
              onChange={handleIndividualBillTypeChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              <option value="kisan">Individual Kisan</option>
              <option value="vyapari">Individual Vyapari</option>
            </select>
          </div>
          {/* Select Entity */}
          <div>
            <label htmlFor="selectedBillEntityId" className="block text-sm font-medium text-gray-700">
              Select {billType === 'kisan' ? 'Kisan' : 'Vyapari'}
            </label>
            <select
              id="selectedBillEntityId"
              name="selectedBillEntityId"
              value={selectedBillEntityId}
              onChange={handleIndividualBillEntityChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              <option value="">Select {billType === 'kisan' ? 'Kisan' : 'Vyapari'}</option>
              {billType === 'kisan'
                ? kisans.map(kisan => <option key={kisan.id} value={kisan.id}>{kisan.name}</option>)
                : vyaparis.map(vyapari => <option key={vyapari.id} value={vyapari.id}>{vyapari.name}</option>)
              }
            </select>
          </div>
          {/* Bill Start Date (Optional) */}
          <div>
            <label htmlFor="individualBillStartDate" className="block text-sm font-medium text-gray-700">
              Period Start Date (Optional)
            </label>
            <input
              type="date"
              id="individualBillStartDate"
              name="individualBillStartDate"
              value={individualBillStartDate}
              onChange={handleIndividualBillDateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          {/* Bill End Date (Optional) */}
          <div>
            <label htmlFor="individualBillEndDate" className="block text-sm font-medium text-gray-700">
              Period End Date (Optional)
            </label>
            <input
              type="date"
              id="individualBillEndDate"
              name="individualBillEndDate"
              value={individualBillEndDate}
              onChange={handleIndividualBillDateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleGenerateIndividualBill}
            disabled={isGeneratingIndividualBill}
            className={`px-6 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isGeneratingIndividualBill
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500'
            }`}
          >
            {isGeneratingIndividualBill ? 'Generating...' : 'Generate Bill/Statement'}
          </button>
        </div>
        {individualBillError && <p className="text-red-500 mt-4 text-center">{individualBillError}</p>}
      </div>

      {/* Daily Mandi Summary Section (NEW) */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Generate Daily Mandi Summary</h2>
        <div className="flex items-end space-x-4">
          <div>
            <label htmlFor="dailyMandiSummaryDate" className="block text-sm font-medium text-gray-700">
              Select Date
            </label>
            <input
              type="date"
              id="dailyMandiSummaryDate"
              name="dailyMandiSummaryDate"
              value={dailyMandiSummaryDate}
              onChange={handleDailyMandiSummaryDateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateDailyMandiSummary}
            disabled={isGeneratingDailyMandiSummary}
            className={`px-6 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isGeneratingDailyMandiSummary
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {isGeneratingDailyMandiSummary ? 'Generating...' : 'Generate Daily Mandi Summary'}
          </button>
        </div>
        {dailyMandiSummaryError && <p className="text-red-500 mt-4 text-center">{dailyMandiSummaryError}</p>}
      </div>


      {transactions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4 text-lg">No transactions found matching your criteria.</p>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={handleSelectAllChange}
                    checked={selectedTransactionIds.length === transactions.length && transactions.length > 0}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </th>
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
                // Using find for display purposes, as names are denormalized
                const kisan = kisans.find(k => k.id === transaction.kisanRef);
                const vyapari = vyaparis.find(v => v.id === transaction.vyapariRef);

                return (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <input
                        type="checkbox"
                        checked={selectedTransactionIds.includes(transaction.id)}
                        onChange={(e) => handleCheckboxChange(transaction.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(transaction.transactionDate as Date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {kisan ? (
                        <CustomTooltip
                          content={
                            <div className="text-center">
                              <p className="font-bold">{kisan.name}</p>
                              <p>Village: {kisan.village || 'N/A'}</p>
                              <p>Contact: {kisan.contactNumber || 'N/A'}</p>
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
                              <p>City: {vyapari.city || 'N/A'}</p>
                              <p>Contact: {vyapari.contactNumber || 'N/A'}</p>
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
      {/* Render Modals (keep as is) */}
      {renderKisanModal()}
      {renderVyapariModal()}

      {/* Individual Bill Generation Modal (Modified) */}
      {showBillModal && individualBillData && (
        <BillModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          billData={individualBillData}
          // billType is no longer needed here as entityType is in billData
        />
      )}

      {/* Daily Mandi Summary Modal (NEW) */}
      {showDailyMandiSummaryModal && dailyMandiSummaryData && (
        <DailyMandiSummaryModal
          isOpen={showDailyMandiSummaryModal}
          onClose={() => setShowDailyMandiSummaryModal(false)}
          summaryData={dailyMandiSummaryData}
        />
      )}

      {/* NEW: Batch Edit Transaction Modal */}
      {showBatchEditTransactionModal && (
        <BatchEditTransactionModal
          isOpen={showBatchEditTransactionModal}
          onClose={() => setShowBatchEditTransactionModal(false)}
          transactionIds={selectedTransactionIds}
          onBatchEditComplete={handleBatchEditComplete}
        />
      )}
    </div>
  );
}
