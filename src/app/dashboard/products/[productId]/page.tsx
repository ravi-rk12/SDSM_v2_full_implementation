// src/app/dashboard/products/[productId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Product } from "@/types"; // Ensure Product type is defined

interface ProductDetailsPageProps {
  params: {
    productId: string; // The ID of the Product from the URL
  };
}

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { productId } = params;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for product details
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg"); // Default unit to 'kg' as per types
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [defaultUnitPrice, setDefaultUnitPrice] = useState<number | ''>(''); // Use '' for empty input
  const [active, setActive] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For Save/Delete operations
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // If productId is 'new', we are creating a new product, so no fetch is needed
      if (productId === "new") {
        setProduct(null); // No existing product
        setIsLoading(false);
        setIsEditing(true); // Automatically go into edit mode for new product
        // Set default values for new product
        setName("");
        setUnit("kg");
        setCategory("");
        setDescription("");
        setDefaultUnitPrice('');
        setActive(true);
        return;
      }

      const fetchedProduct = await firestoreService.getProductById(productId);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
        // Set form states with fetched data, converting null to empty string for inputs
        setName(fetchedProduct.name || "");
        setUnit(fetchedProduct.unit || "kg");
        setCategory(fetchedProduct.category || "");
        setDescription(fetchedProduct.description || "");
        setDefaultUnitPrice(fetchedProduct.defaultUnitPrice ?? ''); // Use ?? for nullish coalescing
        setActive(fetchedProduct.active ?? true); // Default to true if not set
      } else {
        setError("Product not found.");
      }
    } catch (err: any) {
      console.error("Error fetching Product:", err);
      setError(`Failed to load Product: ${err.message || "An unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleSave = async (e: React.FormEvent) => {
    console.log("handleSave triggered for Product");
    e.preventDefault();
    setSubmitMessage(null);
    setIsSubmitting(true);

    // --- Validation ---
    if (!name.trim()) {
      setSubmitMessage({ type: "error", text: "Product Name is required." });
      setIsSubmitting(false);
      return;
    }
    if (!unit.trim()) {
      setSubmitMessage({ type: "error", text: "Unit is required." });
      setIsSubmitting(false);
      return;
    }
    // Default Unit Price is now optional, but if provided, it must be a positive number
    if (typeof defaultUnitPrice === 'number' && defaultUnitPrice <= 0) {
      setSubmitMessage({ type: "error", text: "Default Unit Price must be a positive number if provided." });
      setIsSubmitting(false);
      return;
    }
    // --- End Validation ---

    try {
      const productData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        unit: unit.trim(),
        category: category.trim() === "" ? null : category.trim(),
        description: description.trim() === "" ? null : description.trim(),
        defaultUnitPrice: typeof defaultUnitPrice === 'number' ? defaultUnitPrice : null, // Store as number or null
        active: active,
      };

      if (productId === "new") {
        await firestoreService.addProduct(productData);
        setSubmitMessage({ type: "success", text: "Product added successfully!" });
        router.push("/dashboard/products"); // Redirect to product list after adding
      } else if (product) {
        await firestoreService.updateProduct(productId, productData);
        setSubmitMessage({ type: "success", text: "Product updated successfully!" });
        setIsEditing(false); // Exit editing mode
        fetchProduct(); // Re-fetch updated data
      }
      setTimeout(() => setSubmitMessage(null), 3000); // Clear message
    } catch (err: any) {
      console.error("Error saving Product:", err);
      setSubmitMessage({ type: "error", text: `Failed to save Product: ${err.message || "An unknown error occurred."}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    if (
      window.confirm(
        `Are you sure you want to delete Product "${product.name}"? This action cannot be undone.`
      )
    ) {
      setIsSubmitting(true);
      try {
        await firestoreService.deleteProduct(productId);
        setSubmitMessage({ type: "success", text: "Product deleted successfully!" });
        setTimeout(() => {
          router.push("/dashboard/products"); // Redirect to the product list page
        }, 1500);
      } catch (err: any) {
        console.error("Error deleting Product:", err);
        setSubmitMessage({ type: "error", text: `Failed to delete Product: ${err.message || "An unknown error occurred."}` });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Loading Product Details</h1>
        <p>Loading Product data...</p>
      </div>
    );
  }

  if (error && productId !== "new") { // Only show error if not a new product and an error occurred
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchProduct}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If productId is 'new' and not loading, we proceed to render the form for a new product
  if (!product && productId !== "new") {
    return (
      <div className="container mx-auto p-4 text-gray-700">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p>The requested Product could not be loaded.</p>
        <button
          onClick={() => router.push("/dashboard/products")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {productId === "new" ? "Add New Product" : (isEditing ? "Edit Product" : "Product Details")}
      </h1>

      {submitMessage && (
        <div
          className={`p-3 rounded-md mb-4 ${
            submitMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {submitMessage.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            required
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            required
            disabled={!isEditing || isSubmitting}
          >
            <option value="kg">Kilogram (kg)</option>
            {/* Add other units if necessary, e.g., <option value="quintal">Quintal</option> */}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="e.g., Grains, Vegetables, Fruits"
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={!isEditing || isSubmitting}
          ></textarea>
        </div>

        <div>
          <label htmlFor="defaultUnitPrice" className="block text-sm font-medium text-gray-700">
            Default Unit Price (₹/kg)
          </label>
          <input
            type="number"
            id="defaultUnitPrice"
            value={defaultUnitPrice}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setDefaultUnitPrice(isNaN(value) ? '' : value);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="e.g., 25.50"
            min="0" // Changed min to 0 as it can be null/empty, but if a number, should be non-negative
            step="0.01"
            // Removed 'required' attribute
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={!isEditing || isSubmitting}
          />
          <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
            Product is Active
          </label>
        </div>

        {/* Placeholder for Price Statistics */}
        {product && ( // Only show for existing products
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Average Price:</p>
                <p className="text-md font-bold text-gray-900">
                  ₹{product.averagePrice?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Min Price:</p>
                <p className="text-md font-bold text-gray-900">
                  ₹{product.minPrice?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Max Price:</p>
                <p className="text-md font-bold text-gray-900">
                  ₹{product.maxPrice?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Median Price: <span className="text-xs text-gray-500">(The middle price when all prices are listed from lowest to highest)</span>
                </p>
                <p className="text-md font-bold text-gray-900">
                  ₹{product.medianPrice?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Mode Price: <span className="text-xs text-gray-500">(The price that appears most often)</span>
                </p>
                <p className="text-md font-bold text-gray-900">
                  ₹{product.modePrice?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These statistics are calculated from past transactions and require backend aggregation.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          {productId === "new" ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/dashboard/products")}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Product"}
              </button>
            </>
          ) : (
            // Existing product view/edit buttons
            !isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/products")}
                  className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent accidental form submission
                    console.log("Edit Product button clicked, setting isEditing to true");
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit Product
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form fields to original product values on cancel
                    if (product) {
                      setName(product.name || "");
                      setUnit(product.unit || "kg");
                      setCategory(product.category || "");
                      setDescription(product.description || "");
                      setDefaultUnitPrice(product.defaultUnitPrice ?? '');
                      setActive(product.active ?? true);
                    }
                    setSubmitMessage(null); // Clear any messages
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </>
            )
          )}
        </div>

        {productId !== "new" && ( // Only show delete button for existing products
          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting || isEditing} // Disable if editing or submitting main form
              >
                Delete Product
              </button>
          </div>
        )}
      </form>
    </div>
  );
}
