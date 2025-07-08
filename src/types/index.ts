// src/types/index.ts

import { Timestamp } from 'firebase/firestore'; // Import Timestamp for date fields

// --- Core User/Authentication Types ---
export type UserRole = "superadmin" | "admin" | "operator" | "viewer";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date | Timestamp; // Changed to union type
  lastLoginAt: Date | Timestamp; // Changed to union type
  location?: string;
  lastActivityAt?: Date | Timestamp; // Changed to union type
  featuresUsed?: string[];
  deviceInfo?: {
    browser?: string;
    os?: string;
  };
}

// --- Mandi Entities ---

export interface Kisan {
  id: string; // Firestore Document ID
  name: string; // MANDATORY
  address?: string | null; // Optional for initial entry
  pincode?: string | null; // Optional for initial entry
  village?: string | null; // Auto-filled/suggested from pincode, editable
  district?: string | null; // Auto-filled/suggested from pincode, editable
  state?: string | null; // Auto-filled/suggested from pincode, editable
  contactNumber?: string | null; // OPTIONAL, 10-digit numeric
  hasWhatsapp?: boolean; // Default: true. Master toggle for WhatsApp availability.
  isWhatsappSameAsContact?: boolean; // Default: true. True if whatsappNumber is same as contactNumber.
  whatsappNumber?: string | null; // Only if hasWhatsapp true AND isWhatsappSameAsContact false.
  aadhaarNumber?: string | null; // Optional
  isAnonymous?: boolean; // True for "Nakadi Kisan"
  registeredByRef: string; // UID of the user who registered this Kisan
  bakaya?: number; // Keep as number, Firestore supports it.
  createdAt: Date | Timestamp; // Changed to union type
  updatedAt: Date | Timestamp; // Changed to union type
  notes?: string; // Optional remarks by operator

  // Data Science Fields (Optional or calculated by Cloud Functions - not handled client-side for now)
  landAreaAcres?: number;
  primaryCropTypes?: string[];
  farmingExperienceYears?: number;
  bankAccountDetails?: { accountNumber: string; ifscCode: string }; // Encrypted/masked if stored directly
  averageMonthlyVolumeKg?: number; // Calculated by CF
  totalTransactionsCount?: number; // Calculated by CF
  loyaltyScore?: number; // Calculated by DS
  lastTransactionDate?: Date | Timestamp; // Changed to union type
  preferredPaymentMethod?: string;
}

export interface Vyapari {
  id: string; // Firestore Document ID
  name: string; // MANDATORY
  address?: string | null; // Allow null
  pincode?: string | null; // Allow null
  village?: string | null; // Allow null
  city: string | null;
  district?: string | null; // Allow null
  state?: string | null; // Allow null
  contactNumber?: string | null; // Allow null (THIS IS THE PRIMARY FIX FOR THE ERROR)
  hasWhatsapp?: boolean;
  isWhatsappSameAsContact?: boolean;
  whatsappNumber?: string | null; // Allow null
  gstNumber?: string | null; // Allow null
  isAnonymous?: boolean;
  registeredByRef: string;
  bakaya?: number; // Keep as number, Firestore supports it.
  createdAt: Date | Timestamp; // Changed to union type
  updatedAt: Date | Timestamp; // Changed to union type
  notes?: string | null; // Allow null

  // Data Science Fields (Optional or calculated by Cloud Functions - not handled client-side for now)
  businessType?: string; // e.g., 'Retailer', 'Wholesaler'
  areaOfOperation?: string[]; // Districts/States
  averageMonthlyVolumeKg?: number; // Calculated by CF
  totalTransactionsCount?: number; // Calculated by CF
  loyaltyScore?: number; // Calculated by DS
  lastTransactionDate?: Date | Timestamp; // Changed to union type
}

export interface Product {
  id: string; // Firestore Document ID
  name: string; // MANDATORY
  unit: string; // But changed to 'string', Always 'kg' as per discussion
  category?: string; // e.g., "Grain", "Vegetable"
  description?: string; // Optional
  active: boolean; // Is the product currently active/tradable?
  createdAt: Date | Timestamp; // Changed to union type
  updatedAt: Date | Timestamp; // Changed to union type

  // Data Science Fields (Suggested from external data, user confirmed, or calculated - not handled client-side for now)
  seasonality?: ("Rabi" | "Kharif" | "Zaid" | "Year-round")[]; // CRITICAL for crop suggestions
  typicalYieldPerAcreKg?: number; // Suggested from external data
  shelfLifeDays?: number; // Suggested from external data
  storageRequirements?: string; // Suggested from external data
  lastUnitPriceSold?: number; // Cached by CF
  averageUnitPriceLast7Days?: number; // Calculated by CF
  averageUnitPriceLast30Days?: number; // Calculated by CF
  totalQuantitySoldKg?: number; // Calculated by CF
  marketDemandIndex?: number; // Calculated by DS
  growingRegionIndia?: string[]; // Suggested from external data
}

// --- Transaction & Financial Types ---

// Define the structure of a single item within a transaction
export interface TransactionItem {
  productRef: string; // Reference to the Product document ID
  productName: string; // Display name of the product (from the Product interface)
  quantity: number; // Quantity in KG
  unitPrice: number; // Price per KG
  totalPrice: number; // Calculated: quantity * unitPrice
}

export type TransactionStatus = "pending" | "bakaya" | "paid" | "cancelled"; // Explicitly includes 'bakaya'

// Represents a complete transaction record
export interface Transaction {
  id: string;
  kisanRef: string;
  kisanName: string; // Add this for displaying the name
  vyapariRef: string;
  vyapariName: string; // Add this for displaying the name
  transactionDate: Date | Timestamp; // Changed to union type
  recordedByRef: string;
  items: TransactionItem[];

  subTotal: number;
  totalWeightInKg: number;

  commissionKisanRate: number;
  commissionKisanAmount: number;
  commissionVyapariRatePerKg: number;
  commissionVyapariAmount: number;
  totalCommission: number;

  netAmountKisan: number;
  netAmountVyapari: number;

  amountPaidKisan: number; // ADDED: Amount paid to Kisan at the time of this transaction
  amountPaidVyapari: number; // ADDED: Amount collected from Vyapari at the time of this transaction

  status: 'pending' | 'completed' | 'cancelled'; // Changed to this simpler status for now based on page.tsx usage
  createdAt: Date | Timestamp; // Changed to union type
  updatedAt: Date | Timestamp; // Changed to union type
  notes?: string; // General transaction remarks

  // Data Science Fields (not handled client-side for now)
  mandiRegion: string; // Pre-configured for the Mandi
  weatherConditionsAtTime?: string; // Auto-fetched from weather API
  temperatureCelsius?: number; // Auto-fetched from weather API
  humidityPercent?: number; // Auto-fetched from weather API
  marketSentiment?: string; // Optional manual input by admin
  appliedDiscountAmount?: number;
  appliedOfferId?: string; // Reference to an Offer
  transactionType:
    | "sale_to_vyapari"
    | "purchase_from_kisan"
    | "return_vyapari"
    | "return_kisan"; // More granular
}

export interface Payment {
  id: string; // Firestore Document ID
  entityRef: string; // Document ID of Kisan or Vyapari
  entityType: "kisan" | "vyapari";
  amount: number; // Amount of payment
  paymentType:
    | "cash"
    | "bank_transfer"
    | "cheque"
    | "adjustment"
    | "upi"
    | "card_swipe";
  transactionRef?: string; // Optional: If payment is for a specific transaction
  paymentDate: Date | Timestamp; // Changed to union type
  recordedByRef: string; // UID of the user who recorded the payment
  createdAt: Date | Timestamp; // Changed to union type
  updatedAt: Date | Timestamp; // Changed to union type
  notes?: string; // Payment specific notes
  paymentReferenceId?: string; // e.g., Cheque No., UPI Txn ID, Bank UTR
  bankDetails?: { accountNumber: string; ifscCode: string }; // Masked details
  isSettlementPayment?: boolean; // If intended to clear full outstanding
}

export interface Balance {
  id: string; // Same as Kisan/Vyapari ID for quick lookup
  entityRef: string; // Document ID of Kisan or Vyapari (redundant but explicit)
  entityType: "kisan" | "vyapari";
  currentOutstanding: number; // The live bakaya for this entity (ideally updated via CF)
  lastUpdated: Date | Timestamp; // Changed to union type
  lastAffectedTransactionRef?: string; // Ref to last transaction affecting balance
  lastAffectedPaymentRef?: string; // Ref to last payment affecting balance

  // Data Science Fields (not handled client-side for now)
  totalAmountTransactedYearly?: number; // Sum of net amounts over current year
  totalCommissionGeneratedYearly?: number; // Sum of commission generated over current year
  historicalOutstandingSnapshot?: { [date: string]: number }; // e.g., { 'YYYY-MM-DD': balance } for monthly/quarterly snapshots
}

export interface Bill {
  id: string; // Firestore Document ID
  billNumber: string; // Unique, sequential bill number (ideally generated via CF)
  entityRef: string; // Document ID of Kisan or Vyapari
  entityType: "kisan" | "vyapari";
  transactionsIncludedRefs: string[]; // Array of transaction IDs included in this bill
  billDate: Date | Timestamp; // Changed to union type
  periodStart: Date | Timestamp; // Changed to union type
  periodEnd: Date | Timestamp; // Changed to union type

  previousBakayaAmount: number; // Outstanding balance at periodStart
  totalTransactionsAmount: number; // Sum of subTotals for transactions in period
  totalPaymentsMadeForPeriod: number; // Sum of payments in period
  totalCommissionKisan: number; // Sum of Kisan commission for transactions in period
  totalCommissionVyapari: number; // Sum of Vyapari commission for transactions in period

  netAmountDueFromVyapari?: number; // Final amount Vyapari owes (for Vyapari bills)
  netAmountPayableToKisan?: number; // Final amount Mandi owes Kisan (for Kisan bills)

  finalBakayaAmount: number; // The outstanding balance AFTER this bill (updates Balance.currentOutstanding)

  status: "generated" | "sent" | "paid"; // Tracking bill status
  generatedByRef: string; // UID of user who generated bill
  createdAt: Date | Timestamp; // Changed to union type
  updatedAt: Date | Timestamp; // Changed to union type
  pdfUrl?: string; // URL to archived PDF in Storage (future)
  isRevisedBill?: boolean;
  previousBillRef?: string; // Link to previous version if revised
  billPrintCount?: number;
  billSentWhatsapp?: boolean;
}

export interface ProductPriceHistoryEntry {
  timestamp: Date | Timestamp; // Changed to union type
  price: number; // The unit price
  productRef: string; // Product ID
  transactionRef: string; // Transaction ID
  kisanRef: string; // Kisan ID who sold at this price
  vyapariRef: string; // Vyapari ID who bought at this price
  mandiRegion: string; // Copied from transaction
  weatherConditionsAtTime?: string; // Copied from transaction
  temperatureCelsius?: number; // Copied from transaction
  humidityPercent?: number; // Copied from transaction
  externalMarketPriceKg?: number; // For comparison
}

export interface SystemSettings {
  defaultMandiRegion: string;
  id: "mandiDefaults"; // Fixed ID for the single settings document
  commissionKisanRate: number; // e.g., 0.02 (2%)
  commissionVyapariRatePerKg: number; // e.g., 0.40
  lastBillNumber: number; // For sequential bill number generation (ideally updated via CF)
  mandiName: string;
  mandiAddress: string;
  mandiContact: string;
  mandiRegion: string;
  mandiLogoUrl?: string; // Optional URL for Mandi logo in Storage
  updatedByRef: string; // UID of user who last updated settings
  updatedAt: Date | Timestamp; // Changed to union type
}

// --- Weather Data (Future External Integration - not handled client-side for now) ---
export interface DailyWeatherData {
  id: string; // e.g., "YYYY-MM-DD" + mandiRegionId
  date: Date | Timestamp; // Changed to union type
  mandiRegion: string;
  temperatureCelsius: number;
  humidityPercent: number;
  weatherConditions: string; // e.g., "Clear", "Rain", "Cloudy"
  precipitationMm?: number;
  windSpeedKmh?: number;
  externalSource?: string;
}