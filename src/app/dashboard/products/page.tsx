// src/app/dashboard/products/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Product } from "@/types";
import Modal from '@/components/Modal'; // Assuming you have a generic Modal component
import BatchEditProductModal from '@/components/BatchEditProductModal'; // NEW: Import BatchEditProductModal

// --- CustomTooltip Component (re-used from transactions page) ---
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

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete operation

  // State for Product detail modal (for View/Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // NEW: State for Batch Edit
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBatchEditProductModal, setShowBatchEditProductModal] = useState(false);

  // NEW: State for Sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | null; direction: 'ascending' | 'descending' }>({
    key: 'name', // Default sort by name
    direction: 'ascending',
  });


  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProducts = await firestoreService.getProducts();
      setProducts(fetchedProducts);
      setSelectedProductIds([]); // Clear selections on data refresh
    } catch (err: any) {
      console.error("Error fetching Products:", err);
      setError(
        `Failed to load Products: ${err.message || "An unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete Product "${name}"? This action cannot be undone.`)) {
      setIsDeleting(true); // Indicate that a delete operation is in progress
      try {
        await firestoreService.deleteProduct(id);
        setProducts(products.filter((product) => product.id !== id));
      } catch (err: any) {
        console.error("Error deleting Product:", err);
        setError(`Failed to delete Product: ${err.message || "An unknown error occurred."}`);
      } finally {
        setIsDeleting(false); // Reset delete state
      }
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const renderProductModal = () => {
    if (!selectedProduct) return null;
    return (
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={`Product Details: ${selectedProduct.name}`}
      >
        <div className="space-y-3 p-4">
          <p><strong>Unit:</strong> {selectedProduct.unit}</p>
          <p><strong>Category:</strong> {selectedProduct.category || 'N/A'}</p>
          <p><strong>Description:</strong> {selectedProduct.description || 'N/A'}</p>
          <p><strong>Default Unit Price:</strong> ₹{selectedProduct.defaultUnitPrice?.toFixed(2) || '0.00'}</p>
          <p><strong>Active:</strong> {selectedProduct.active ? 'Yes' : 'No'}</p>
          <p className="font-bold mt-4">Price Statistics:</p>
          <p><strong>Average Price:</strong> ₹{selectedProduct.averagePrice?.toFixed(2) || 'N/A'}</p>
          <p><strong>Min Price:</strong> ₹{selectedProduct.minPrice?.toFixed(2) || 'N/A'}</p>
          <p><strong>Max Price:</strong> ₹{selectedProduct.maxPrice?.toFixed(2) || 'N/A'}</p>
          <p><strong>Median Price:</strong> ₹{selectedProduct.medianPrice?.toFixed(2) || 'N/A'}</p>
          <p><strong>Mode Price:</strong> ₹{selectedProduct.modePrice?.toFixed(2) || 'N/A'}</p>
          <button
            onClick={() => setShowProductModal(false)}
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
      setSelectedProductIds(prev => [...prev, id]);
    } else {
      setSelectedProductIds(prev => prev.filter(productId => productId !== id));
    }
  };

  // NEW: Handle select all checkbox
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map(product => product.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  // NEW: Open Batch Edit Modal
  const handleOpenBatchEditModal = () => {
    if (selectedProductIds.length > 0) {
      setShowBatchEditProductModal(true);
    }
  };

  // NEW: Callback for when batch edit is complete (to refresh list)
  const handleBatchEditComplete = () => {
    setShowBatchEditProductModal(false);
    fetchProducts(); // Re-fetch all products to reflect changes
  };

  // NEW: Sorting logic
  const sortedProducts = useMemo(() => {
    let sortableProducts = [...products];
    if (sortConfig.key !== null) {
      sortableProducts.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        // Handle undefined/null values for numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (sortConfig.direction === 'ascending') {
            return (aValue || 0) - (bValue || 0);
          } else {
            return (bValue || 0) - (aValue || 0);
          }
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Case-insensitive string comparison
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        // Fallback for other types or mixed types (keep original order)
        return 0;
      });
    }
    return sortableProducts;
  }, [products, sortConfig]);

  const requestSort = (key: keyof Product) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Product) => {
    if (sortConfig.key !== key) {
      return '';
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-full">
        <p className="text-xl text-gray-700">Loading Products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchProducts}
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
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleOpenBatchEditModal}
            disabled={selectedProductIds.length === 0}
            className={`px-4 py-2 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedProductIds.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
            }`}
          >
            Batch Edit ({selectedProductIds.length})
          </button>
          <Link href="/dashboard/products/add" passHref>
            <button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Add New Product
            </button>
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4 text-lg">No Products found. Add your first Product!</p>
          <Link href="/dashboard/products/add">
            <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Add First Product
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
                    checked={selectedProductIds.length === products.length && products.length > 0}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  Name {getSortIndicator('name')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('category')}
                >
                  Category {getSortIndicator('category')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('averagePrice')}
                >
                  Avg Price {getSortIndicator('averagePrice')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('minPrice')}
                >
                  Min Price {getSortIndicator('minPrice')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('maxPrice')}
                >
                  Max Price {getSortIndicator('maxPrice')}
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
              {sortedProducts.map((product) => ( // Use sortedProducts here
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={(e) => handleCheckboxChange(product.id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <CustomTooltip
                      content={
                        <div className="text-left">
                          <p><strong>Median Price:</strong> ₹{product.medianPrice?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Mode Price:</strong> ₹{product.modePrice?.toFixed(2) || 'N/A'}</p>
                        </div>
                      }
                    >
                      ₹{product.averagePrice?.toFixed(2) || 'N/A'}
                    </CustomTooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <CustomTooltip
                      content={
                        <div className="text-left">
                          <p><strong>Average Price:</strong> ₹{product.averagePrice?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Max Price:</strong> ₹{product.maxPrice?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Median Price:</strong> ₹{product.medianPrice?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Mode Price:</strong> ₹{product.modePrice?.toFixed(2) || 'N/A'}</p>
                        </div>
                      }
                    >
                      ₹{product.minPrice?.toFixed(2) || 'N/A'}
                    </CustomTooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <CustomTooltip
                      content={
                        <div className="text-left">
                          <p><strong>Average Price:</strong> ₹{product.averagePrice?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Min Price:</strong> ₹{product.minPrice?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Median Price:</strong> ₹{product.medianPrice?.toFixed(2) || 'N/A'}</p>
                          <p><strong>Mode Price:</strong> ₹{product.modePrice?.toFixed(2) || 'N/A'}</p>
                        </div>
                      }
                    >
                      ₹{product.maxPrice?.toFixed(2) || 'N/A'}
                    </CustomTooltip>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View / Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
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

      {/* Product Details Modal */}
      {renderProductModal()}

      {/* NEW: Batch Edit Product Modal */}
      {showBatchEditProductModal && (
        <BatchEditProductModal
          isOpen={showBatchEditProductModal}
          onClose={() => setShowBatchEditProductModal(false)}
          productIds={selectedProductIds}
          onBatchEditComplete={handleBatchEditComplete}
        />
      )}
    </div>
  );
}
