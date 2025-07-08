// src/app/dashboard/transactions/add/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/clientApp";
import { db } from "@/lib/firebase/clientApp"; // Import db for batch writes
import { doc, writeBatch, collection } from "firebase/firestore"; // Import Firestore functions, ADDED 'collection'

import {
  Kisan,
  Vyapari,
  Product,
  SystemSettings,
  Transaction,
  TransactionItem,
} from "@/types";
import * as firestoreService from "@/lib/firebase/firestoreService"; // Corrected typo comment

import Modal from "@/components/Modal";
import AddKisanQuickForm from "@/components/AddKisanQuickForm";
import AddVyapariQuickForm from "@/components/AddVyapariQuickForm";
import AddProductQuickForm from "@/components/AddProductQuickForm";

interface FormTransactionItem extends TransactionItem {
  tempId: string; // Used for UI keying before Firestore ID is assigned
}

export default function RecordTransactionPage() {
  const router = useRouter();

  // State for fetched data
  const [kisans, setKisans] = useState<Kisan[]>([]);
  const [vyaparis, setVyaparis] = useState<Vyapari[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(
    null
  );

  // Loading and error states for initial data fetch
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedKisanId, setSelectedKisanId] = useState<string>("");
  const [selectedVyapariId, setSelectedVyapariId] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split("T")[0] //YYYY-MM-DD format
  );
  const [transactionItems, setTransactionItems] = useState<
    FormTransactionItem[]
  >([]);
  const [notes, setNotes] = useState<string>("");

  // Bakaya related states
  const [kisanBakaya, setKisanBakaya] = useState<number | null>(null);
  const [vyapariBakaya, setVyapariBakaya] = useState<number | null>(null);
  const [amountPaidKisan, setAmountPaidKisan] = useState<number>(0);
  const [amountPaidVyapari, setAmountPaidVyapari] = useState<number>(0);

  // State for submission process
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // State for quick-add modals
  const [showAddKisanModal, setShowAddKisanModal] = useState(false);
  const [showAddVyapariModal, setShowAddVyapariModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // --- Data Fetching Effect ---
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [fetchedKisans, fetchedVyaparis, fetchedProducts, fetchedSettings] =
        await Promise.all([
          firestoreService.getKisans(),
          firestoreService.getVyaparis(),
          firestoreService.getProducts(),
          firestoreService.getSystemSettings(),
        ]);

      setKisans(fetchedKisans);
      setVyaparis(fetchedVyaparis);
      setProducts(fetchedProducts);
      setSystemSettings(fetchedSettings);
    } catch (err: any) {
      console.error("Error fetching data for transaction page:", err);
      setError(
        `Failed to load data: ${err.message || "An unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Effect to fetch Kisan Bakaya when selectedKisanId changes ---
  useEffect(() => {
    const fetchKisanBakaya = async () => {
      if (selectedKisanId) {
        const kisan = kisans.find((k) => k.id === selectedKisanId);
        if (kisan) {
          setKisanBakaya(kisan.bakaya || 0); // Assuming 'bakaya' field exists
        } else {
          setKisanBakaya(null);
        }
      } else {
        setKisanBakaya(null);
      }
      setAmountPaidKisan(0); // Reset paid amount when Kisan changes
    };
    fetchKisanBakaya();
  }, [selectedKisanId, kisans]); // Depend on kisans array to react to quick add

  // --- Effect to fetch Vyapari Bakaya when selectedVyapariId changes ---
  useEffect(() => {
    const fetchVyapariBakaya = async () => {
      if (selectedVyapariId) {
        const vyapari = vyaparis.find((v) => v.id === selectedVyapariId);
        if (vyapari) {
          setVyapariBakaya(vyapari.bakaya || 0); // Assuming 'bakaya' field exists
        } else {
          setVyapariBakaya(null);
        }
      } else {
        setVyapariBakaya(null);
      }
      setAmountPaidVyapari(0); // Reset paid amount when Vyapari changes
    };
    fetchVyapariBakaya();
  }, [selectedVyapariId, vyaparis]); // Depend on vyaparis array to react to quick add

  // --- Handlers for Transaction Items ---
  const handleAddItem = useCallback(() => {
    const newItem: FormTransactionItem = {
      tempId:
        Date.now().toString() + Math.random().toString(36).substring(2, 9),
      productRef: "",
      productName: "",
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
    };
    setTransactionItems((prevItems) => [...prevItems, newItem]);
  }, []);

  const handleUpdateItem = useCallback(
    (
      index: number,
      field: keyof Omit<TransactionItem, "totalPrice">,
      value: any
    ) => {
      setTransactionItems((prevItems) => {
        const updatedItems = [...prevItems];
        const itemToUpdate = { ...updatedItems[index] };

        if (field === "productRef") {
          itemToUpdate.productRef = value;
          const selectedProduct = products.find((p) => p.id === value);
          itemToUpdate.productName = selectedProduct
            ? selectedProduct.name
            : "";
        } else {
          (itemToUpdate as any)[field] = parseFloat(value) || 0;
        }

        itemToUpdate.totalPrice =
          itemToUpdate.quantity * itemToUpdate.unitPrice;
        updatedItems[index] = itemToUpdate;

        return updatedItems;
      });
    },
    [products]
  );

  const handleRemoveItem = useCallback((tempIdToRemove: string) => {
    setTransactionItems((prevItems) =>
      prevItems.filter((item) => item.tempId !== tempIdToRemove)
    );
  }, []);

  // --- Handlers for Quick Add Modals ---
  const handleKisanAdded = useCallback(
    async (newKisanId: string) => {
      setShowAddKisanModal(false);
      await fetchData();
      setSelectedKisanId(newKisanId);
      setSubmitMessage({
        type: "success",
        text: "New Kisan added successfully!",
      });
      setTimeout(() => setSubmitMessage(null), 3000);
    },
    [fetchData]
  );

  const handleCancelAddKisan = useCallback(() => {
    setShowAddKisanModal(false);
  }, []);

  const handleVyapariAdded = useCallback(
    async (newVyapariId: string) => {
      setShowAddVyapariModal(false);
      await fetchData();
      setSelectedVyapariId(newVyapariId);
      setSubmitMessage({
        type: "success",
        text: "New Vyapari added successfully!",
      });
      setTimeout(() => setSubmitMessage(null), 3000);
    },
    [fetchData]
  );

  const handleCancelAddVyapari = useCallback(() => {
    setShowAddVyapariModal(false);
  }, []);

  const handleProductAdded = useCallback(
    async (newProductId: string) => {
      setShowAddProductModal(false);
      await fetchData();
      setSubmitMessage({
        type: "success",
        text: "New Product added successfully!",
      });
      setTimeout(() => setSubmitMessage(null), 3000);
    },
    [fetchData]
  );

  const handleCancelAddProduct = useCallback(() => {
    setShowAddProductModal(false);
  }, []);

  // --- Calculated Values (useMemo for efficiency) ---
  const subTotal = useMemo(() => {
    return transactionItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [transactionItems]);

  const totalWeightInKg = useMemo(() => {
    return transactionItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [transactionItems]);

  const displayCommissionKisanRate = systemSettings?.commissionKisanRate || 0;
  const displayCommissionVyapariRatePerKg =
    systemSettings?.commissionVyapariRatePerKg || 0;

  const displayCommissionKisanAmount = useMemo(() => {
    return subTotal * displayCommissionKisanRate;
  }, [subTotal, displayCommissionKisanRate]);

  const displayCommissionVyapariAmount = useMemo(() => {
    return totalWeightInKg * displayCommissionVyapariRatePerKg;
  }, [totalWeightInKg, displayCommissionVyapariRatePerKg]);

  const displayTotalCommission = useMemo(() => {
    return displayCommissionKisanAmount + displayCommissionVyapariAmount;
  }, [displayCommissionKisanAmount, displayCommissionVyapariAmount]);

  const displayNetAmountKisan = useMemo(() => {
    return subTotal - displayCommissionKisanAmount;
  }, [subTotal, displayCommissionKisanAmount]);

  const displayNetAmountVyapari = useMemo(() => {
    return subTotal + displayCommissionVyapariAmount;
  }, [subTotal, displayCommissionVyapariAmount]);

  // --- Calculate Net Bakaya changes ---
  // These represent the 'impact' of the current transaction on the bakaya, before payments are considered
  const kisanNetChange = useMemo(() => {
    return displayNetAmountKisan; // Amount Mandi needs to pay Kisan for this transaction
  }, [displayNetAmountKisan]);

  const vyapariNetChange = useMemo(() => {
    return displayNetAmountVyapari; // Amount Vyapari needs to pay Mandi for this transaction
  }, [displayNetAmountVyapari]);

  const newKisanBakaya = useMemo(() => {
    if (kisanBakaya === null) return null;
    // Current Bakaya (Kisan owes Mandi if positive, Mandi owes Kisan if negative)
    // - kisanNetChange (Mandi owes Kisan, so this reduces Kisan's debt or increases Mandi's debt to Kisan)
    // + amountPaidKisan (Mandi pays Kisan, so this reduces Mandi's debt to Kisan or increases Kisan's debt to Mandi if paid more than owed)
    return (kisanBakaya - kisanNetChange + amountPaidKisan).toFixed(2);
  }, [kisanBakaya, kisanNetChange, amountPaidKisan]);

  const newVyapariBakaya = useMemo(() => {
    if (vyapariBakaya === null) return null;
    // Current Bakaya (Vyapari owes Mandi if positive, Mandi owes Vyapari if negative)
    // + vyapariNetChange (Vyapari owes Mandi, so this increases Vyapari's debt or reduces Mandi's debt to Vyapari)
    // - amountPaidVyapari (Vyapari pays Mandi, so this reduces Vyapari's debt to Mandi or increases Mandi's debt to Vyapari)
    return (vyapariBakaya + vyapariNetChange - amountPaidVyapari).toFixed(2);
  }, [vyapariBakaya, vyapariNetChange, amountPaidVyapari]);

  // --- Form Submission Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    setIsSubmitting(true);

    if (
      !selectedKisanId ||
      !selectedVyapariId ||
      transactionItems.length === 0
    ) {
      setSubmitMessage({
        type: "error",
        text: "Please select a Kisan and Vyapari, and add at least one item.",
      });
      setIsSubmitting(false);
      return;
    }

    const invalidItems = transactionItems.some(
      (item) => !item.productRef || item.quantity <= 0 || item.unitPrice <= 0
    );
    if (invalidItems) {
      setSubmitMessage({
        type: "error",
        text: "All items must have a selected product, positive quantity, and positive unit price.",
      });
      setIsSubmitting(false);
      return;
    }

    if (!systemSettings) {
      setSubmitMessage({
        type: "error",
        text: "System settings not loaded. Cannot calculate commissions. Please refresh the page.",
      });
      setIsSubmitting(false);
      return;
    }

    const selectedKisan = kisans.find((k) => k.id === selectedKisanId);
    const selectedVyapari = vyaparis.find((v) => v.id === selectedVyapariId);

    if (!selectedKisan) {
      setSubmitMessage({
        type: "error",
        text: "Selected Kisan not found. Please re-select or add a new Kisan.",
      });
      setIsSubmitting(false);
      return;
    }
    if (!selectedVyapari) {
      setSubmitMessage({
        type: "error",
        text: "Selected Vyapari not found. Please re-select or add a new Vyapari.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setSubmitMessage({
          type: "error",
          text: "You must be logged in to record a transaction.",
        });
        setIsSubmitting(false);
        router.push("/login");
        return;
      }

      // Initialize Firestore batch for atomic writes
      const batch = writeBatch(db);

      const newTransaction: Omit<
        Transaction,
        "id" | "createdAt" | "updatedAt"
      > = {
        kisanRef: selectedKisanId,
        kisanName: selectedKisan.name,
        vyapariRef: selectedVyapariId,
        vyapariName: selectedVyapari.name,
        transactionDate: new Date(transactionDate),
        recordedByRef: currentUser.uid,
        items: transactionItems.map((item) => ({
          productRef: item.productRef,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        subTotal: parseFloat(subTotal.toFixed(2)),
        totalWeightInKg: parseFloat(totalWeightInKg.toFixed(2)),

        commissionKisanRate: systemSettings.commissionKisanRate,
        commissionKisanAmount: parseFloat(
          displayCommissionKisanAmount.toFixed(2)
        ),
        commissionVyapariRatePerKg: systemSettings.commissionVyapariRatePerKg,
        commissionVyapariAmount: parseFloat(
          displayCommissionVyapariAmount.toFixed(2)
        ),
        totalCommission: parseFloat(displayTotalCommission.toFixed(2)),

        netAmountKisan: parseFloat(displayNetAmountKisan.toFixed(2)),
        netAmountVyapari: parseFloat(displayNetAmountVyapari.toFixed(2)),

        // Include amounts paid at the time of transaction
        amountPaidKisan: parseFloat(amountPaidKisan.toFixed(2)),
        amountPaidVyapari: parseFloat(amountPaidVyapari.toFixed(2)),

        notes: notes || "",
        status: "pending",
        transactionType: "sale_to_vyapari",
        mandiRegion: systemSettings.defaultMandiRegion || "",
      };

      // Add the new transaction to the batch
      const transactionRef = doc(
        collection(db, "transactions"), // Corrected: Added 'collection'
        firestoreService.generateFirestoreId()
      ); // Generate a new ID
      batch.set(transactionRef, {
        ...newTransaction,
        createdAt: firestoreService.serverTimestamp(),
        updatedAt: firestoreService.serverTimestamp(),
        id: transactionRef.id, // Add the generated ID to the document
      });

      // Update Kisan's bakaya
      const kisanRef = doc(db, "kisans", selectedKisanId);
      const calculatedKisanNewBakaya =
        (selectedKisan.bakaya || 0) - displayNetAmountKisan + amountPaidKisan; // CORRECTED LOGIC
      batch.update(kisanRef, {
        bakaya: parseFloat(calculatedKisanNewBakaya.toFixed(2)),
      });

      // Update Vyapari's bakaya
      const vyapariRef = doc(db, "vyaparis", selectedVyapariId);
      const calculatedVyapariNewBakaya =
        (selectedVyapari.bakaya || 0) +
        displayNetAmountVyapari -
        amountPaidVyapari;
      batch.update(vyapariRef, {
        bakaya: parseFloat(calculatedVyapariNewBakaya.toFixed(2)),
      });

      // Commit the batch
      await batch.commit();

      setSubmitMessage({
        type: "success",
        text: "Transaction recorded and balances updated successfully!",
      });

      // Clear form fields after successful submission
      setSelectedKisanId("");
      setSelectedVyapariId("");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      setTransactionItems([]);
      setNotes("");
      setAmountPaidKisan(0);
      setAmountPaidVyapari(0);
      setKisanBakaya(null);
      setVyapariBakaya(null);

      // Re-fetch data to reflect updated bakayas in dropdowns if needed, or simply redirect
      setTimeout(() => {
        router.push("/dashboard/transactions");
      }, 2000);
    } catch (err: any) {
      console.error("Error recording transaction or updating balances:", err);
      setSubmitMessage({
        type: "error",
        text: `Failed to record transaction or update balances: ${
          err.message || "An unknown error occurred."
        }`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        <p>Loading essential data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  const isDataReady = systemSettings !== null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Record New Transaction
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Submission Message Display */}
        {submitMessage && (
          <div
            className={`p-3 rounded-md mb-4 ${
              submitMessage.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        {/* Transaction Details Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Transaction Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction Date */}
            <div>
              <label
                htmlFor="transactionDate"
                className="block text-sm font-medium text-gray-700"
              >
                Date
              </label>
              <input
                type="date"
                id="transactionDate"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Kisan Selection with Add New Button & Bakaya */}
            <div>
              <label
                htmlFor="kisanSelect"
                className="block text-sm font-medium text-gray-700"
              >
                Kisan (Seller)
              </label>
              <div className="flex items-center space-x-2">
                <select
                  id="kisanSelect"
                  value={selectedKisanId}
                  onChange={(e) => setSelectedKisanId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a Kisan</option>
                  {kisans.map((kisan) => (
                    <option key={kisan.id} value={kisan.id}>
                      {kisan.name} {kisan.village ? `(${kisan.village})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddKisanModal(true)}
                  className="mt-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  + Add New
                </button>
              </div>
              {selectedKisanId && kisanBakaya !== null && (
                <p
                  className={`text-sm mt-1 ${
                    kisanBakaya < 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Current Bakaya: ₹{kisanBakaya.toFixed(2)}{" "}
                  {kisanBakaya < 0
                    ? "(Market owes Kisan)"
                    : "(Kisan owes Market)"}
                </p>
              )}
              {kisans.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No Kisans found. Add one now!
                </p>
              )}
            </div>

            {/* Vyapari Selection with Add New Button & Bakaya */}
            <div>
              <label
                htmlFor="vyapariSelect"
                className="block text-sm font-medium text-gray-700"
              >
                Vyapari (Buyer)
              </label>
              <div className="flex items-center space-x-2">
                <select
                  id="vyapariSelect"
                  value={selectedVyapariId}
                  onChange={(e) => setSelectedVyapariId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a Vyapari</option>
                  {vyaparis.map((vyapari) => (
                    <option key={vyapari.id} value={vyapari.id}>
                      {vyapari.name} {vyapari.city ? `(${vyapari.city})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddVyapariModal(true)}
                  className="mt-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  + Add New
                </button>
              </div>
              {selectedVyapariId && vyapariBakaya !== null && (
                <p
                  className={`text-sm mt-1 ${
                    vyapariBakaya < 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Current Bakaya: ₹{vyapariBakaya.toFixed(2)}{" "}
                  {vyapariBakaya < 0
                    ? "(Vyapari owes Market)"
                    : "(Market owes Vyapari)"}
                </p>
              )}
              {vyaparis.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No Vyaparis found. Add one now!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* --- Transaction Items Section --- */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Items</h2>

          {/* General "No Products" message with Add Product button */}
          {products.length === 0 && (
            <p className="text-sm text-red-500 mb-4 flex items-center">
              No Products found. Please add products to record transactions.
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="ml-2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                + Add Product Now
              </button>
            </p>
          )}

          {transactionItems.map((item, index) => (
            <div
              key={item.tempId}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4 p-4 border rounded-md relative"
            >
              <div className="md:col-span-2">
                <label
                  htmlFor={`product-${item.tempId}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Product
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    id={`product-${item.tempId}`}
                    value={item.productRef}
                    onChange={(e) =>
                      handleUpdateItem(index, "productRef", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="mt-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor={`quantity-${item.tempId}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Quantity (KG)
                </label>
                <input
                  type="number"
                  id={`quantity-${item.tempId}`}
                  value={item.quantity === 0 ? "" : item.quantity}
                  onChange={(e) =>
                    handleUpdateItem(index, "quantity", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                  min="0"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor={`unitPrice-${item.tempId}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Unit Price (₹/KG)
                </label>
                <input
                  type="number"
                  id={`unitPrice-${item.tempId}`}
                  value={item.unitPrice === 0 ? "" : item.unitPrice}
                  onChange={(e) =>
                    handleUpdateItem(index, "unitPrice", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                  min="0"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="text-right">
                <label className="block text-sm font-medium text-gray-700">
                  Total
                </label>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  ₹{item.totalPrice.toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveItem(item.tempId)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
                aria-label="Remove item"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            + Add Item
          </button>

          {/* Totals Summary */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium text-gray-700">
                Sub Total:
              </span>
              <span className="text-lg font-semibold text-gray-900">
                ₹{subTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium text-gray-700">
                Total Weight (Kg):
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {totalWeightInKg.toFixed(2)} Kg
              </span>
            </div>

            {/* Commissions and Net Amounts Display */}
            {systemSettings && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Calculations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      Kisan Commission (
                      {systemSettings.commissionKisanRate * 100}%):
                    </span>
                    <span className="font-medium">
                      ₹{displayCommissionKisanAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Vyapari Commission (₹
                      {systemSettings.commissionVyapariRatePerKg.toFixed(2)}
                      /Kg):
                    </span>
                    <span className="font-medium">
                      ₹{displayCommissionVyapariAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t">
                    <span>Total Commission:</span>
                    <span>₹{displayTotalCommission.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="flex justify-between items-center mb-2 text-lg font-bold">
                    <span>Net Amount to Kisan:</span>
                    <span className="text-green-700">
                      ₹{displayNetAmountKisan.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Net Amount from Vyapari:</span>
                    <span className="text-blue-700">
                      ₹{displayNetAmountVyapari.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount Paid and Bakaya Section */}
        {(selectedKisanId || selectedVyapariId) && ( // Only show if at least one is selected
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Payment & Bakaya Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kisan Payment */}
              {selectedKisanId && kisanBakaya !== null && (
                <div>
                  <label
                    htmlFor="amountPaidKisan"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Amount Paid to Kisan (₹)
                    <span className="text-xs text-gray-500 ml-1">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="number"
                    id="amountPaidKisan"
                    value={amountPaidKisan === 0 ? "" : amountPaidKisan}
                    onChange={(e) =>
                      setAmountPaidKisan(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm mt-1">
                    New Kisan Bakaya:{" "}
                    <span
                      className={`font-semibold ${
                        parseFloat(newKisanBakaya || "0") < 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{newKisanBakaya || "0.00"}{" "}
                      {parseFloat(newKisanBakaya || "0") < 0
                        ? "(Market will owe Kisan)"
                        : "(Kisan will owe Market)"}
                    </span>
                  </p>
                </div>
              )}

              {/* Vyapari Payment */}
              {selectedVyapariId && vyapariBakaya !== null && (
                <div>
                  <label
                    htmlFor="amountPaidVyapari"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Amount Collected from Vyapari (₹)
                    <span className="text-xs text-gray-500 ml-1">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="number"
                    id="amountPaidVyapari"
                    value={amountPaidVyapari === 0 ? "" : amountPaidVyapari}
                    onChange={(e) =>
                      setAmountPaidVyapari(parseFloat(e.target.value) || 0)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm mt-1">
                    New Vyapari Bakaya:{" "}
                    <span
                      className={`font-semibold ${
                        parseFloat(newVyapariBakaya || "0") < 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{newVyapariBakaya || "0.00"}{" "}
                      {parseFloat(newVyapariBakaya || "0") < 0
                        ? "(Market will owe Vyapari)"
                        : "(Vyapari will owe Market)"}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="Any additional notes for this transaction..."
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={
              !selectedKisanId ||
              !selectedVyapariId ||
              transactionItems.length === 0 ||
              transactionItems.some(
                (item) =>
                  !item.productRef || item.quantity <= 0 || item.unitPrice <= 0
              ) ||
              !isDataReady || // Ensure settings are loaded
              isSubmitting
            }
          >
            {isSubmitting
              ? "Recording & Updating Balances..."
              : "Record Transaction & Update Balances"}
          </button>
        </div>
      </form>

      {/* Quick Add Modals (remain unchanged) */}
      <Modal
        isOpen={showAddKisanModal}
        onClose={handleCancelAddKisan}
        title="Add New Kisan"
      >
        <AddKisanQuickForm
          onSuccess={handleKisanAdded}
          onCancel={handleCancelAddKisan}
        />
      </Modal>

      <Modal
        isOpen={showAddVyapariModal}
        onClose={handleCancelAddVyapari}
        title="Add New Vyapari"
      >
        <AddVyapariQuickForm
          onSuccess={handleVyapariAdded}
          onCancel={handleCancelAddVyapari}
        />
      </Modal>

      <Modal
        isOpen={showAddProductModal}
        onClose={handleCancelAddProduct}
        title="Add New Product"
      >
        <AddProductQuickForm
          onSuccess={handleProductAdded}
          onCancel={handleCancelAddProduct}
        />
      </Modal>
    </div>
  );
}