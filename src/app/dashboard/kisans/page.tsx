// src/app/dashboard/kisans/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Kisan } from "@/types"; // Make sure you have the Kisan type defined

export default function KisansPage() {
  const [kisans, setKisans] = useState<Kisan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKisans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedKisans = await firestoreService.getKisans();
      setKisans(fetchedKisans);
    } catch (err: any) {
      console.error("Error fetching Kisans:", err);
      setError(`Failed to load Kisans: ${err.message || "An unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKisans();
  }, [fetchKisans]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Manage Kisans</h1>
        <p>Loading Kisans...</p>
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
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Kisans</h1>

      <div className="flex justify-end mb-4">
        <Link href="/dashboard/kisans/add">
          <button className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            Add New Kisan
          </button>
        </Link>
      </div>

      {kisans.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">No Kisans registered yet.</p>
          <Link href="/dashboard/kisans/add">
            <button className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Add Your First Kisan
            </button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Village
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Bakaya
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {kisans.map((kisan) => (
                <tr key={kisan.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {kisan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kisan.village}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {kisan.contactNumber}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${kisan.bakaya && kisan.bakaya < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{kisan.bakaya?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/dashboard/kisans/${kisan.id}`}>
                      <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                        View/Edit
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}