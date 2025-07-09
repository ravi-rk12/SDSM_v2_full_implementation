// src/app/dashboard/transactions/add/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Kisan,
  Vyapari,
  Product,
  TransactionItem,
} from "@/types";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { generateFirestoreId } from "@/lib/firebase/firestoreService"; // Assuming this utility is available
import { getAuth } from "firebase/auth"; // For getting current user's UID
import { app } from "@/lib/firebase/clientApp"; // Assuming Firebase app is initialized here

// Define a local type for form items that aligns with TransactionItem
interface FormTransactionItem {
  tempId: string; // Used for unique keys in the form UI before saving
  productId: string; // This should match TransactionItem's productId
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function AddTransactionPage() {
  const router = useRouter();
  const auth = getAuth(app); // Get auth instance

  const [kisans, setKisans] = useState<Kisan[]>([]);
  const [vyaparis, setVyaparis] = useState<Vyapari[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    transactionDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    kisanRef: "",
    vyapariRef: "",
    commissionKisanRate: 0, // Default commission for Kisan
    commissionVyapariRatePerKg: 0, // Default commission per Kg for Vyapari
    amountPaidKisan: 0, // Cash paid to kisan at transaction time
    amountPaidVyapari: 0, // Cash collected from vyapari at transaction time
    notes: "",
    mandiRegion: "Default Mandi Region", // Placeholder, ideally from system settings
    transactionType: "sale_to_vyapari" as "sale_to_vyapari" | "purchase_from_kisan" | "return_vyapari" | "return_kisan",
  });

  const [formItems, setFormItems] = useState<FormTransactionItem[]>([]);

  // Fetch initial data (Kisans, Vyaparis, Products)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [fetchedKisans, fetchedVyaparis, fetchedProducts] =
          await Promise.all([
            firestoreService.getKisans(),
            firestoreService.getVyaparis(),
            firestoreService.getProducts(),
          ]);
        setKisans(fetchedKisans);
        setVyaparis(fetchedVyaparis);
        setProducts(fetchedProducts);

        // Set default commission rates from SystemSettings if available
        const settings = await firestoreService.getSystemSettings();
        if (settings) {
          setFormData((prev) => ({
            ...prev,
            commissionKisanRate: settings.commissionKisanRate || 0,
            commissionVyapariRatePerKg: settings.commissionVyapariRatePerKg || 0,
            mandiRegion: settings.mandiDefaults?.mandiRegion || "Default Mandi Region",
          }));
        }
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddItem = () => {
    setFormItems([
      ...formItems,
      {
        tempId: generateFirestoreId(), // Unique ID for React list key
        productId: "",
        productName: "", // Will be populated when product is selected
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (tempId: string) => {
    setFormItems(formItems.filter((item) => item.tempId !== tempId));
  };

  const handleItemChange = (
    tempId: string,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormItems((prevItems) =>
      prevItems.map((item) => {
        if (item.tempId === tempId) {
          let updatedItem = { ...item, [name]: value };

          // If product is selected, update product name and default unit price
          if (name === "productId") {
            const selectedProduct = products.find((p) => p.id === value);
            if (selectedProduct) {
              updatedItem.productName = selectedProduct.name;
              updatedItem.unitPrice = selectedProduct.defaultUnitPrice || 0;
            } else {
              updatedItem.productName = "";
              updatedItem.unitPrice = 0;
            }
          }

          // Recalculate total price if quantity or unit price changes
          if (name === "quantity" || name === "unitPrice") {
            const quantity = parseFloat(updatedItem.quantity.toString()) || 0;
            const unitPrice = parseFloat(updatedItem.unitPrice.toString()) || 0;
            updatedItem.totalPrice = quantity * unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Calculate totals for display
  const { subTotal, totalWeightInKg } = useMemo(() => {
    let calculatedSubTotal = 0;
    let calculatedTotalWeightInKg = 0;
    formItems.forEach((item) => {
      calculatedSubTotal += item.totalPrice;
      calculatedTotalWeightInKg += item.quantity;
    });
    return {
      subTotal: calculatedSubTotal,
      totalWeightInKg: calculatedTotalWeightInKg,
    };
  }, [formItems]);

  const commissionKisanAmount = useMemo(
    () => subTotal * (formData.commissionKisanRate / 100),
    [subTotal, formData.commissionKisanRate]
  );
  const commissionVyapariAmount = useMemo(
    () => totalWeightInKg * formData.commissionVyapariRatePerKg,
    [totalWeightInKg, formData.commissionVyapariRatePerKg]
  );
  const totalCommission = useMemo(
    () => commissionKisanAmount + commissionVyapariAmount,
    [commissionKisanAmount, commissionVyapariAmount]
  );

  const netAmountKisan = useMemo(
    () => subTotal - commissionKisanAmount - formData.amountPaidKisan,
    [subTotal, commissionKisanAmount, formData.amountPaidKisan]
  );
  const netAmountVyapari = useMemo(
    () => subTotal + commissionVyapariAmount - formData.amountPaidVyapari,
    [subTotal, commissionVyapariAmount, formData.amountPaidVyapari]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("User not authenticated. Please log in.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.kisanRef || !formData.vyapariRef || formItems.length === 0) {
      setError("Please fill in all required fields and add at least one item.");
      setIsSubmitting(false);
      return;
    }

    // Prepare items for Firestore (ensure they match TransactionItem structure)
    const itemsForFirestore: TransactionItem[] = formItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    try {
      const transactionData = {
        transactionDate: new Date(formData.transactionDate),
        kisanRef: formData.kisanRef,
        vyapariRef: formData.vyapariRef,
        recordedByRef: currentUser.uid, // User who recorded the transaction
        items: itemsForFirestore,
        subTotal: subTotal,
        totalWeightInKg: totalWeightInKg,
        commissionKisanRate: formData.commissionKisanRate,
        commissionKisanAmount: commissionKisanAmount,
        commissionVyapariRatePerKg: formData.commissionVyapariRatePerKg,
        commissionVyapariAmount: commissionVyapariAmount,
        totalCommission: totalCommission,
        netAmountKisan: netAmountKisan,
        netAmountVyapari: netAmountVyapari,
        amountPaidKisan: formData.amountPaidKisan,
        amountPaidVyapari: formData.amountPaidVyapari,
        status: 'completed' as 'completed', // Default to completed for new transactions
        notes: formData.notes,
        productRefs: formItems.map(item => item.productId), // Denormalized product IDs
        mandiRegion: formData.mandiRegion,
        transactionType: formData.transactionType,
      };

      await firestoreService.addTransaction(transactionData);
      setSuccessMessage("Transaction recorded successfully!");
      // Optionally reset form or redirect
      setFormData({
        transactionDate: new Date().toISOString().split("T")[0],
        kisanRef: "",
        vyapariRef: "",
        commissionKisanRate: 0,
        commissionVyapariRatePerKg: 0,
        amountPaidKisan: 0,
        amountPaidVyapari: 0,
        notes: "",
        mandiRegion: "Default Mandi Region",
        transactionType: "sale_to_vyapari",
      });
      setFormItems([]);
      router.push("/dashboard/transactions"); // Redirect to transactions list
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      setError(`Failed to add transaction: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-full">
        <p className="text-xl text-gray-700">Loading data...</p>
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple reload to re-fetch
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Record New Transaction
      </h1>

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> {successMessage}</span>
          <span
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccessMessage(null)}
          >
            <svg
              className="fill-current h-6 w-6 text-green-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </span>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <span
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <svg
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Transaction Date */}
          <div>
            <label
              htmlFor="transactionDate"
              className="block text-sm font-medium text-gray-700"
            >
              Transaction Date
            </label>
            <input
              type="date"
              id="transactionDate"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          {/* Kisan Select */}
          <div>
            <label
              htmlFor="kisanRef"
              className="block text-sm font-medium text-gray-700"
            >
              Select Kisan
            </label>
            <select
              id="kisanRef"
              name="kisanRef"
              value={formData.kisanRef}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
            >
              <option value="">-- Select Kisan --</option>
              {kisans.map((kisan) => (
                <option key={kisan.id} value={kisan.id}>
                  {kisan.name} ({kisan.village || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {/* Vyapari Select */}
          <div>
            <label
              htmlFor="vyapariRef"
              className="block text-sm font-medium text-gray-700"
            >
              Select Vyapari
            </label>
            <select
              id="vyapariRef"
              name="vyapariRef"
              value={formData.vyapariRef}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
            >
              <option value="">-- Select Vyapari --</option>
              {vyaparis.map((vyapari) => (
                <option key={vyapari.id} value={vyapari.id}>
                  {vyapari.name} ({vyapari.city || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label
              htmlFor="transactionType"
              className="block text-sm font-medium text-gray-700"
            >
              Transaction Type
            </label>
            <select
              id="transactionType"
              name="transactionType"
              value={formData.transactionType}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
            >
              <option value="sale_to_vyapari">Sale to Vyapari</option>
              <option value="purchase_from_kisan">Purchase from Kisan</option>
              <option value="return_vyapari">Return from Vyapari</option>
              <option value="return_kisan">Return to Kisan</option>
            </select>
          </div>

          {/* Mandi Region */}
          <div>
            <label
              htmlFor="mandiRegion"
              className="block text-sm font-medium text-gray-700"
            >
              Mandi Region
            </label>
            <input
              type="text"
              id="mandiRegion"
              name="mandiRegion"
              value={formData.mandiRegion}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
        </div>

        {/* Transaction Items Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Transaction Items
          </h2>
          {formItems.length === 0 && (
            <p className="text-gray-500 mb-4">No items added yet.</p>
          )}
          {formItems.map((item) => (
            <div
              key={item.tempId}
              className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-gray-50 p-4 rounded-md mb-4 items-end"
            >
              {/* Product Select */}
              <div className="md:col-span-2">
                <label
                  htmlFor={`productId-${item.tempId}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Product
                </label>
                <select
                  id={`productId-${item.tempId}`}
                  name="productId" // This should be productId
                  value={item.productId}
                  onChange={(e) => handleItemChange(item.tempId, e)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white"
                >
                  <option value="">-- Select Product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label
                  htmlFor={`quantity-${item.tempId}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Quantity (Kg)
                </label>
                <input
                  type="number"
                  id={`quantity-${item.tempId}`}
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.tempId, e)}
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>

              {/* Unit Price */}
              <div>
                <label
                  htmlFor={`unitPrice-${item.tempId}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Unit Price (₹/Kg)
                </label>
                <input
                  type="number"
                  id={`unitPrice-${item.tempId}`}
                  name="unitPrice"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(item.tempId, e)}
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>

              {/* Total Price */}
              <div className="md:col-span-1">
                <label
                  htmlFor={`totalPrice-${item.tempId}`}
                  className="block text-sm font-medium text-gray-700"
                >
                  Total Price
                </label>
                <input
                  type="text"
                  id={`totalPrice-${item.tempId}`}
                  name="totalPrice"
                  value={item.totalPrice.toFixed(2)}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Remove Button */}
              <div className="md:col-span-1 flex justify-end items-center">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.tempId)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddItem}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Item
          </button>
        </div>

        {/* Financial Summary */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>
              <strong>SubTotal (Total Value of Goods):</strong> ₹
              {subTotal.toFixed(2)}
            </p>
            <p>
              <strong>Total Weight:</strong> {totalWeightInKg.toFixed(2)} Kg
            </p>
            <div>
              <label
                htmlFor="commissionKisanRate"
                className="block text-sm font-medium text-gray-700"
              >
                Kisan Commission Rate (%)
              </label>
              <input
                type="number"
                id="commissionKisanRate"
                name="commissionKisanRate"
                value={formData.commissionKisanRate}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
              <p className="text-sm text-gray-600">
                Commission Amount: ₹{commissionKisanAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <label
                htmlFor="commissionVyapariRatePerKg"
                className="block text-sm font-medium text-gray-700"
              >
                Vyapari Commission Rate (₹/Kg)
              </label>
              <input
                type="number"
                id="commissionVyapariRatePerKg"
                name="commissionVyapariRatePerKg"
                value={formData.commissionVyapariRatePerKg}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
              <p className="text-sm text-gray-600">
                Commission Amount: ₹{commissionVyapariAmount.toFixed(2)}
              </p>
            </div>
            <p className="md:col-span-2 text-lg font-bold">
              Total Commission: ₹{totalCommission.toFixed(2)}
            </p>
            <p className="md:col-span-2 text-lg font-bold">
              Net Amount Payable to Kisan: ₹{netAmountKisan.toFixed(2)}
            </p>
            <p className="md:col-span-2 text-lg font-bold">
              Net Amount Receivable from Vyapari: ₹{netAmountVyapari.toFixed(2)}
            </p>

            {/* Amount Paid/Collected at transaction time */}
            <div>
              <label
                htmlFor="amountPaidKisan"
                className="block text-sm font-medium text-gray-700"
              >
                Cash Paid to Kisan (at transaction)
              </label>
              <input
                type="number"
                id="amountPaidKisan"
                name="amountPaidKisan"
                value={formData.amountPaidKisan}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
            </div>
            <div>
              <label
                htmlFor="amountPaidVyapari"
                className="block text-sm font-medium text-gray-700"
              >
                Cash Collected from Vyapari (at transaction)
              </label>
              <input
                type="number"
                id="amountPaidVyapari"
                name="amountPaidVyapari"
                value={formData.amountPaidVyapari}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
            </div>
          </div>
        </div>

        {/* Notes/Remarks */}
        <div className="mb-6">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes/Remarks
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
            }`}
          >
            {isSubmitting ? "Recording Transaction..." : "Record Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
}
