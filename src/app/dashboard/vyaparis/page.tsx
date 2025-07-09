// src/app/dashboard/vyaparis/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Vyapari } from "@/types";

export default function VyaparisListPage() {
  const router = useRouter();
  const [vyaparis, setVyaparis] = useState<Vyapari[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVyaparis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedVyaparis = await firestoreService.getVyaparis();
      setVyaparis(fetchedVyaparis);
    } catch (err: any) {
      console.error("Error fetching Vyaparis:", err);
      setError(`Failed to load Vyaparis: ${err.message || "An unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVyaparis();
  }, [fetchVyaparis]);

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
        <Link href="/dashboard/vyaparis/new" passHref>
          <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Add New Vyapari
          </button>
        </Link>
      </div>

      {vyaparis.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 text-lg">No Vyaparis found. Click "Add New Vyapari" to get started!</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                      {vyapari.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vyapari.contactNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vyapari.city || "N/A"}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        (vyapari.bakaya || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ₹{(vyapari.bakaya || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/vyaparis/${vyapari.id}`} passHref>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          View / Edit
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
