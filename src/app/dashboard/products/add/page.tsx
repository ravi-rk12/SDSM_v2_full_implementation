// src/app/dashboard/products/add/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as firestoreService from "@/lib/firebase/firestoreService"; // Assuming this handles addProduct
import { Product } from "@/types"; // Import your Product type
import { getAuth } from "firebase/auth"; // To get the current user's UID

export default function AddProductPage() {
  const router = useRouter();

  // Form states
  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("kg"); // Default unit to 'kg' as per previous discussions
  const [category, setCategory] = useState("");
  const [defaultUnitPrice, setDefaultUnitPrice] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true); // Default to active
  const [description, setDescription] = useState("");

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitMessage(null);
      setIsSubmitting(true);

      // Basic validation
      if (!productName.trim() || defaultUnitPrice <= 0) {
        setSubmitMessage({
          type: "error",
          text: "Product Name and Default Unit Price (must be positive) are required.",
        });
        setIsSubmitting(false);
        return;
      }

      try {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (!currentUser) {
          setSubmitMessage({
            type: "error",
            text: "You must be logged in to add a product.",
          });
          setIsSubmitting(false);
          router.push("/login"); // Redirect to login if not authenticated
          return;
        }

        const newProduct: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
          name: productName.trim(),
          unit: unit,
          category: category.trim() || undefined, // Set to undefined if empty
          description: description.trim() || undefined, // Set to undefined if empty
          defaultUnitPrice: parseFloat(defaultUnitPrice.toFixed(2)),
          active: active,
        };

        // firestoreService.addProduct should handle adding createdAt, updatedAt, and assigning an ID
        await firestoreService.addProduct(newProduct);

        setSubmitMessage({
          type: "success",
          text: "Product added successfully!",
        });

        // Clear form fields
        setProductName("");
        setUnit("kg");
        setCategory("");
        setDefaultUnitPrice(0);
        setActive(true);
        setDescription("");

        // Optional: Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard/products");
        }, 2000);
      } catch (err: any) {
        console.error("Error adding product:", err);
        setSubmitMessage({
          type: "error",
          text: `Failed to add product: ${
            err.message || "An unknown error occurred."
          }`,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      productName,
      unit,
      category,
      defaultUnitPrice,
      active,
      description,
      router,
    ]
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Add New Product</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
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

        {/* Product Name */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Default Unit Price */}
        <div>
          <label htmlFor="defaultUnitPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Default Unit Price (₹/Kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="defaultUnitPrice"
            value={defaultUnitPrice === 0 ? '' : defaultUnitPrice} // Display empty for 0
            onChange={(e) => setDefaultUnitPrice(parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            min="0"
            step="0.01"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Unit (Fixed to Kg as per discussion) */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <input
            type="text"
            id="unit"
            value={unit}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
            readOnly
            disabled={isSubmitting}
          />
          <p className="mt-1 text-sm text-gray-500">Unit is set to Kilograms (Kg).</p>
        </div>

        {/* Category (Optional) */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category (e.g., Grain, Vegetable)
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Description (Optional) */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., High-quality, organic, etc."
            disabled={isSubmitting}
          ></textarea>
        </div>

        {/* Active Status Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
            Product is Active
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/products')}
            className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding Product..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
