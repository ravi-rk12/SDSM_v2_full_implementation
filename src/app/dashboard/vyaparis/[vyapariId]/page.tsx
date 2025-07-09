// src/app/dashboard/vyaparis/[vyapariId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as firestoreService from "@/lib/firebase/firestoreService";
import { Vyapari, Payment } from "@/types"; // Ensure Vyapari and Payment types are defined and updated
import { getAuth } from "firebase/auth";
import Modal from "@/components/Modal"; // Assuming you have a Modal component

interface VyapariDetailsPageProps {
  params: {
    vyapariId: string; // The ID of the Vyapari from the URL
  };
}

export default function VyapariDetailsPage({ params }: VyapariDetailsPageProps) {
  const { vyapariId } = params;
  const router = useRouter();

  const [vyapari, setVyapari] = useState<Vyapari | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states (for editing Vyapari details)
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isWhatsappSameAsMobile, setIsWhatsappSameAsMobile] = useState(false);
  const [alternateContactNumber, setAlternateContactNumber] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(""); // City is mandatory for Vyapari
  const [pincode, setPincode] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [cropsBought, setCropsBought] = useState(""); // Input as comma-separated string

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For Save/Delete operations
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States for Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<Payment['paymentType']>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Regex definitions moved to a higher scope
  const mobileRegex = /^\d{10}$/; // Exactly 10 digits
  const gstRegex = /^[0-9A-Za-z]{15}$/; // Exactly 15 alphanumeric characters

  const fetchVyapari = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Handle "new" Vyapari creation
      if (vyapariId === "new") {
        setVyapari(null); // No existing vyapari
        setIsLoading(false);
        setIsEditing(true); // Automatically go into edit mode for new vyapari
        // Reset/clear all form states for a new entry
        setName("");
        setContactNumber("");
        setWhatsappNumber("");
        setIsWhatsappSameAsMobile(false); // Default to false for new
        setAlternateContactNumber("");
        setVillage("");
        setAddress("");
        setCity("");
        setPincode("");
        setDistrict("");
        setState("");
        setGstNumber("");
        setCropsBought("");
        return; // Exit early as no fetch is needed
      }

      const fetchedVyapari = await firestoreService.getVyapariById(vyapariId);
      if (fetchedVyapari) {
        setVyapari(fetchedVyapari);
        // Set form states with fetched data, converting null to empty string for inputs
        setName(fetchedVyapari.name || "");
        setContactNumber(fetchedVyapari.contactNumber || "");
        setWhatsappNumber(fetchedVyapari.whatsappNumber || "");
        setAlternateContactNumber(fetchedVyapari.alternateContactNumber || "");
        setVillage(fetchedVyapari.village || "");
        setAddress(fetchedVyapari.address || "");
        setCity(fetchedVyapari.city || "");
        setPincode(fetchedVyapari.pincode || "");
        setDistrict(fetchedVyapari.district || "");
        setState(fetchedVyapari.state || "");
        setGstNumber(fetchedVyapari.gstNumber || "");
        setCropsBought(fetchedVyapari.cropsBought?.join(', ') || ""); // Use cropsBought from type

        // Determine if WhatsApp number is same as contact number
        setIsWhatsappSameAsMobile(
          !!fetchedVyapari.contactNumber &&
          fetchedVyapari.contactNumber === fetchedVyapari.whatsappNumber
        );

      } else {
        setError("Vyapari not found.");
      }
    } catch (err: any) {
      console.error("Error fetching Vyapari:", err);
      setError(`Failed to load Vyapari: ${err.message || "An unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  }, [vyapariId]);

  useEffect(() => {
    fetchVyapari();
  }, [fetchVyapari]);

  // Handle WhatsApp Same As Mobile toggle
  useEffect(() => {
    if (isWhatsappSameAsMobile) {
      setWhatsappNumber(contactNumber);
    } else if (vyapari && !isEditing) {
      // If toggle is off and not in editing mode, reset whatsappNumber to original vyapari value
      setWhatsappNumber(vyapari.whatsappNumber || "");
    }
  }, [isWhatsappSameAsMobile, contactNumber, vyapari, isEditing]);


  const handleSave = async (e: React.FormEvent) => {
    console.log("handleSave triggered for Vyapari");
    e.preventDefault();
    setSubmitMessage(null);
    setIsSubmitting(true);

    // --- Validation ---
    if (!name.trim()) {
      setSubmitMessage({ type: "error", text: "Vyapari Name is required." });
      setIsSubmitting(false);
      return;
    }
    if (!city.trim()) {
      setSubmitMessage({ type: "error", text: "City is required for Vyapari." });
      setIsSubmitting(false);
      return;
    }

    if (contactNumber.trim() && !mobileRegex.test(contactNumber.trim())) {
      setSubmitMessage({ type: "error", text: "Contact Number must be exactly 10 digits." });
      setIsSubmitting(false);
      return;
    }
    if (!isWhatsappSameAsMobile && whatsappNumber.trim() && !mobileRegex.test(whatsappNumber.trim())) {
      setSubmitMessage({ type: "error", text: "WhatsApp Number must be exactly 10 digits." });
      setIsSubmitting(false);
      return;
    }
    if (alternateContactNumber.trim() && !mobileRegex.test(alternateContactNumber.trim())) {
      setSubmitMessage({ type: "error", text: "Alternate Contact Number must be exactly 10 digits." });
      setIsSubmitting(false);
      return;
    }
    // GST Number validation (15 alphanumeric characters)
    if (gstNumber.trim() && !gstRegex.test(gstNumber.trim())) {
      setSubmitMessage({ type: "error", text: "GST Number must be exactly 15 alphanumeric characters." });
      setIsSubmitting(false);
      return;
    }
    // --- End Validation ---

    try {
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;

      if (!currentUser) {
        setSubmitMessage({ type: "error", text: "You must be logged in to save Vyapari data." });
        setIsSubmitting(false);
        return;
      }

      const vyapariDataToSave: Omit<Vyapari, "id" | "createdAt" | "updatedAt" | "bakaya" | "lastTransactionDate"> = {
        name: name.trim(),
        contactNumber: contactNumber.trim() === "" ? null : contactNumber.trim(),
        whatsappNumber: isWhatsappSameAsMobile ? (contactNumber.trim() === "" ? null : contactNumber.trim()) : (whatsappNumber.trim() === "" ? null : whatsappNumber.trim()),
        alternateContactNumber: alternateContactNumber.trim() === "" ? null : alternateContactNumber.trim(),
        village: village.trim() === "" ? null : village.trim(),
        address: address.trim() === "" ? null : address.trim(),
        city: city.trim(),
        pincode: pincode.trim() === "" ? null : pincode.trim(),
        district: district.trim() === "" ? null : district.trim(),
        state: state.trim() === "" ? null : state.trim(),
        gstNumber: gstNumber.trim() === "" ? null : gstNumber.trim().toUpperCase(),
        cropsBought: cropsBought.trim() === "" ? null : cropsBought.split(',').map(crop => crop.trim()).filter(crop => crop !== ''),
        registeredByRef: currentUser.uid, // Set registeredByRef for new vyapari
      };

      if (vyapariId === "new") {
        await firestoreService.addVyapari(vyapariDataToSave);
        setSubmitMessage({ type: "success", text: "Vyapari added successfully!" });
        router.push("/dashboard/vyaparis"); // Redirect to list after adding
      } else if (vyapari) {
        // For updates, we only send the partial data that can be updated
        const updatedVyapariData: Partial<Omit<Vyapari, "id" | "createdAt">> = {
          name: name.trim(),
          contactNumber: contactNumber.trim() === "" ? null : contactNumber.trim(),
          whatsappNumber: isWhatsappSameAsMobile ? (contactNumber.trim() === "" ? null : contactNumber.trim()) : (whatsappNumber.trim() === "" ? null : whatsappNumber.trim()),
          alternateContactNumber: alternateContactNumber.trim() === "" ? null : alternateContactNumber.trim(),
          village: village.trim() === "" ? null : village.trim(),
          address: address.trim() === "" ? null : address.trim(),
          city: city.trim(),
          pincode: pincode.trim() === "" ? null : pincode.trim(),
          district: district.trim() === "" ? null : district.trim(),
          state: state.trim() === "" ? null : state.trim(),
          gstNumber: gstNumber.trim() === "" ? null : gstNumber.trim().toUpperCase(),
          cropsBought: cropsBought.trim() === "" ? null : cropsBought.split(',').map(crop => crop.trim()).filter(crop => crop !== ''),
        };
        await firestoreService.updateVyapari(vyapariId, updatedVyapariData);
        setSubmitMessage({ type: "success", text: "Vyapari updated successfully!" });
        setIsEditing(false); // Exit editing mode
        fetchVyapari(); // Re-fetch updated data to show latest values
      }
      setTimeout(() => setSubmitMessage(null), 3000); // Clear message
    } catch (err: any) {
      console.error("Error saving Vyapari:", err);
      setSubmitMessage({ type: "error", text: `Failed to save Vyapari: ${err.message || "An unknown error occurred."}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vyapari || vyapariId === "new") return; // Cannot delete a new/non-existent vyapari

    if (
      window.confirm(
        `Are you sure you want to delete Vyapari "${vyapari.name}"? This action cannot be undone.`
      )
    ) {
      setIsSubmitting(true);
      try {
        await firestoreService.deleteVyapari(vyapariId);
        setSubmitMessage({ type: "success", text: "Vyapari deleted successfully!" });
        setTimeout(() => {
          router.push("/dashboard/vyaparis"); // Redirect to the Vyapari list page
        }, 1500);
      } catch (err: any) {
        console.error("Error deleting Vyapari:", err);
        setSubmitMessage({ type: "error", text: `Failed to delete Vyapari: ${err.message || "An unknown error occurred."}` });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // --- Payment Modal Handlers ---
  const handleOpenPaymentModal = () => {
    if (!vyapari) return;
    setPaymentAmount(0); // Reset amount
    setPaymentType('cash'); // Reset type
    setPaymentNotes(''); // Reset notes
    setPaymentMessage(null); // Clear previous messages
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentMessage(null); // Clear message on close
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentMessage(null);
    setIsProcessingPayment(true);

    if (!vyapari) {
      setPaymentMessage({ type: "error", text: "Vyapari data not loaded for payment." });
      setIsProcessingPayment(false);
      return;
    }
    if (paymentAmount <= 0) {
      setPaymentMessage({ type: "error", text: "Payment amount must be positive." });
      setIsProcessingPayment(false);
      return;
    }

    try {
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;

      if (!currentUser) {
        setPaymentMessage({ type: "error", text: "You must be logged in to record a payment." });
        setIsProcessingPayment(false);
        return;
      }

      const newPayment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
        entityRef: vyapari.id,
        entityType: 'vyapari', // IMPORTANT: Set entityType to 'vyapari'
        amount: paymentAmount,
        paymentType: paymentType,
        paymentDate: new Date(), // Current date
        recordedByRef: currentUser.uid,
        notes: paymentNotes.trim() || undefined,
        isSettlementPayment: false,
      };

      await firestoreService.addPayment(newPayment);

      setPaymentMessage({ type: "success", text: "Payment recorded and balance updated!" });
      await fetchVyapari(); // Re-fetch vyapari data to show updated bakaya
      
      setTimeout(() => {
        handleClosePaymentModal();
      }, 1500);

    } catch (err: any) {
      console.error("Error processing payment:", err);
      setPaymentMessage({ type: "error", text: `Failed to record payment: ${err.message || "An unknown error occurred."}` });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Loading Vyapari Details</h1>
        <p>Loading Vyapari data...</p>
      </div>
    );
  }

  // Adjusted error handling: if it's a new vyapari, don't show "Vyapari not found" error
  if (error && vyapariId !== "new") {
    return (
      <div className="container mx-auto p-4 text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={fetchVyapari}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  // If not loading and not a new vyapari, and vyapari is null, then it's genuinely not found
  if (!vyapari && vyapariId !== "new") {
    return (
      <div className="container mx-auto p-4 text-gray-700">
        <h1 className="text-2xl font-bold mb-4">Vyapari Not Found</h1>
        <p>The requested Vyapari could not be loaded.</p>
        <button
          onClick={() => router.push("/dashboard/vyaparis")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Vyaparis
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {vyapariId === "new" ? "Add New Vyapari" : (isEditing ? "Edit Vyapari" : "Vyapari Details")}
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
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            type="tel"
            id="contactNumber"
            value={contactNumber}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 10) {
                setContactNumber(value);
              }
            }}
            onBlur={() => {
              const mobileRegex = /^\d{10}$/; // Define regex locally for onBlur
              if (contactNumber.trim() && !mobileRegex.test(contactNumber.trim())) {
                setSubmitMessage({ type: "error", text: "Contact Number must be exactly 10 digits." });
              } else {
                setSubmitMessage(null);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="e.g., 9876543210"
            maxLength={10}
            disabled={!isEditing || isSubmitting}
          />
        </div>

        {/* WhatsApp Number Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isWhatsappSameAsMobile"
            checked={isWhatsappSameAsMobile}
            onChange={(e) => setIsWhatsappSameAsMobile(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={!isEditing || isSubmitting}
          />
          <label htmlFor="isWhatsappSameAsMobile" className="ml-2 block text-sm font-medium text-gray-700">
            WhatsApp Number is same as Contact Number
          </label>
        </div>

        {/* WhatsApp Number Input (conditionally enabled) */}
        <div>
          <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700">
            WhatsApp Number
          </label>
          <input
            type="tel"
            id="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 10) {
                setWhatsappNumber(value);
              }
            }}
            onBlur={() => {
              const mobileRegex = /^\d{10}$/; // Define regex locally for onBlur
              if (!isWhatsappSameAsMobile && whatsappNumber.trim() && !mobileRegex.test(whatsappNumber.trim())) {
                setSubmitMessage({ type: "error", text: "WhatsApp Number must be exactly 10 digits." });
              } else {
                setSubmitMessage(null);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="e.g., 9876543210"
            maxLength={10}
            disabled={!isEditing || isSubmitting || isWhatsappSameAsMobile}
          />
        </div>

        {/* Alternate Contact Number */}
        <div>
          <label htmlFor="alternateContactNumber" className="block text-sm font-medium text-gray-700">
            Alternate Contact Number
          </label>
          <input
            type="tel"
            id="alternateContactNumber"
            value={alternateContactNumber}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 10) {
                setAlternateContactNumber(value);
              }
            }}
            onBlur={() => {
              const mobileRegex = /^\d{10}$/; // Define regex locally for onBlur
              if (alternateContactNumber.trim() && !mobileRegex.test(alternateContactNumber.trim())) {
                setSubmitMessage({ type: "error", text: "Alternate Contact Number must be exactly 10 digits." });
              } else {
                setSubmitMessage(null);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="e.g., 9988776655"
            maxLength={10}
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            disabled={!isEditing || isSubmitting}
          ></textarea>
        </div>

        <div>
          <label htmlFor="village" className="block text-sm font-medium text-gray-700">
            Village
          </label>
          <input
            type="text"
            id="village"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            required
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
            Pincode
          </label>
          <input
            type="text"
            id="pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700">
            District
          </label>
          <input
            type="text"
            id="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            disabled={!isEditing || isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            type="text"
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            disabled={!isEditing || isSubmitting}
          />
        </div>

        {/* GST Number */}
        <div>
          <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
            GST Number
          </label>
          <input
            type="text"
            id="gstNumber"
            value={gstNumber}
            onChange={(e) => {
              const value = e.target.value;
              // Allow alphanumeric and limit to 15
              if (/^[0-9A-Za-z]*$/.test(value) && value.length <= 15) {
                setGstNumber(value.toUpperCase()); // Store in uppercase
              }
            }}
            onBlur={() => {
              const gstRegex = /^[0-9A-Za-z]{15}$/; // Define regex locally for onBlur
              if (gstNumber.trim() && !gstRegex.test(gstNumber.trim())) {
                setSubmitMessage({ type: "error", text: "GST Number must be exactly 15 alphanumeric characters." });
              } else {
                setSubmitMessage(null);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="e.g., 27ABCDE1234F1Z5"
            maxLength={15}
            disabled={!isEditing || isSubmitting}
          />
        </div>

        {/* Crops Bought */}
        <div>
          <label htmlFor="cropsBought" className="block text-sm font-medium text-gray-700">
            Crops Bought (comma-separated)
          </label>
          <input
            type="text"
            id="cropsBought"
            value={cropsBought}
            onChange={(e) => setCropsBought(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            placeholder="e.g., Wheat, Rice, Spices"
            disabled={!isEditing || isSubmitting}
          />
        </div>

        {/* Display Bakaya - Only for existing Vyaparis */}
        {vyapariId !== "new" && vyapari && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Outstanding Balance (Bakaya)
            </label>
            <p
              className={`mt-1 text-lg font-semibold ${
                vyapari.bakaya && vyapari.bakaya < 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ₹{vyapari.bakaya?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500">
              This balance updates automatically with transactions and payments.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          {vyapariId === "new" ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/dashboard/vyaparis")}
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
                {isSubmitting ? "Adding..." : "Add Vyapari"}
              </button>
            </>
          ) : (
            // Existing vyapari view/edit buttons
            !isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/vyaparis")}
                  className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent accidental form submission
                    console.log("Edit Vyapari button clicked, setting isEditing to true");
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit Vyapari
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form fields to original vyapari values on cancel
                    if (vyapari) {
                      setName(vyapari.name || "");
                      setContactNumber(vyapari.contactNumber || "");
                      setWhatsappNumber(vyapari.whatsappNumber || "");
                      setAlternateContactNumber(vyapari.alternateContactNumber || "");
                      setVillage(vyapari.village || "");
                      setAddress(vyapari.address || "");
                      setCity(vyapari.city || "");
                      setPincode(vyapari.pincode || "");
                      setDistrict(vyapari.district || "");
                      setState(vyapari.state || "");
                      setGstNumber(vyapari.gstNumber || "");
                      setCropsBought(vyapari.cropsBought?.join(', ') || "");
                      setIsWhatsappSameAsMobile(
                        !!vyapari.contactNumber &&
                        vyapari.contactNumber === vyapari.whatsappNumber
                      );
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

        {vyapariId !== "new" && ( // Only show action buttons for existing vyaparis
          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={handleOpenPaymentModal}
                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting || isEditing} // Disable if editing or submitting main form
              >
                Record Payment
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting || isEditing} // Disable if editing or submitting main form
              >
                Delete Vyapari
              </button>
          </div>
        )}
      </form>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        title={`Record Payment for ${vyapari?.name || 'Vyapari'}`}
      >
        <form onSubmit={handleProcessPayment} className="p-4 space-y-4">
          {paymentMessage && (
            <div
              className={`p-3 rounded-md mb-4 ${
                paymentMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {paymentMessage.text}
            </div>
          )}
          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="paymentAmount"
              value={paymentAmount === 0 ? '' : paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              min="0.01"
              step="0.01"
              required
              disabled={isProcessingPayment}
            />
          </div>
          <div>
            <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <select
              id="paymentType"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as Payment['paymentType'])}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              disabled={isProcessingPayment}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="adjustment">Adjustment</option>
              <option value="card_swipe">Card Swipe</option>
            </select>
          </div>
          <div>
            <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              id="paymentNotes"
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              placeholder="e.g., Paid via GPay, Cheque No. 12345"
              disabled={isProcessingPayment}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleClosePaymentModal}
              className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400"
              disabled={isProcessingPayment}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
