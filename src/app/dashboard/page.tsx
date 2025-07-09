// src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/clientApp"; // Assuming you have Firebase auth
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Kisan, Vyapari, Product, Transaction } from "@/types"; // Import your types

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [summary, setSummary] = useState({
    totalKisans: 0,
    totalVyaparis: 0,
    totalProducts: 0,
    totalTransactions: 0,
    // You might add net bakaya for the mandi here if you have that logic
    // netMandiBakaya: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch summary data
      const [kisans, vyaparis, products, transactions] = await Promise.all([
        firestoreService.getKisans(),
        firestoreService.getVyaparis(),
        firestoreService.getProducts(),
        firestoreService.getTransactions(), // Fetch all transactions for count and recent
      ]);

      setSummary({
        totalKisans: kisans.length,
        totalVyaparis: vyaparis.length,
        totalProducts: products.length,
        totalTransactions: transactions.length,
      });

      // Sort transactions by date (most recent first) and take the top N
      const sortedTransactions = transactions.sort(
        (a, b) =>
          (b.transactionDate as Date).getTime() -
          (a.transactionDate as Date).getTime()
      );
      setRecentTransactions(sortedTransactions.slice(0, 5)); // Show top 5 recent transactions

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(
        `Failed to load dashboard data: ${
          err.message || "An unknown error occurred"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set user name from Firebase Auth if available
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserName(user.displayName || user.email || "User");
      } else {
        setUserName("Guest"); // Or redirect to login if not authenticated
      }
    });

    fetchData(); // Fetch dashboard summary data

    return () => unsubscribe(); // Clean up auth listener
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <p className="text-xl text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Welcome, {userName}!
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500">Total Kisans</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {summary.totalKisans}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-500">Total Vyaparis</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {summary.totalVyaparis}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <p className="text-sm font-medium text-gray-500">Total Products</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {summary.totalProducts}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <p className="text-sm font-medium text-gray-500">
            Total Transactions
          </p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {summary.totalTransactions}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/transactions/add">
            <button className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Record New Transaction
            </button>
          </Link>
          <Link href="/dashboard/kisans">
            <button className="w-full px-4 py-3 bg-gray-700 text-white font-medium rounded-md shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2">
              Manage Kisans
            </button>
          </Link>
          <Link href="/dashboard/vyaparis">
            <button className="w-full px-4 py-3 bg-gray-700 text-white font-medium rounded-md shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2">
              Manage Vyaparis
            </button>
          </Link>
          <Link href="/dashboard/products">
            <button className="w-full px-4 py-3 bg-gray-700 text-white font-medium rounded-md shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2">
              Manage Products
            </button>
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Recent Transactions
        </h2>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-600">No recent transactions to display.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Total Amount
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
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(transaction.transactionDate as Date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.kisanName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.vyapariName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{transaction.netAmountVyapari.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/transactions/${transaction.id}`}>
                        <button className="text-indigo-600 hover:text-indigo-900">
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 text-right">
          <Link href="/dashboard/transactions">
            <button className="text-indigo-600 hover:text-indigo-900 font-medium">
              View All Transactions &rarr;
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}