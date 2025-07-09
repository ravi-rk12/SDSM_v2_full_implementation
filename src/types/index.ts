// src/types/index.ts

import { Timestamp, FieldValue } from 'firebase/firestore'; // Import FieldValue for serverTimestamp

// --- Core User/Authentication Types ---
export type UserRole = "superadmin" | "admin" | "operator" | "viewer";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date | Timestamp | FieldValue; // Allow FieldValue
  lastLoginAt: Date | Timestamp | FieldValue; // Allow FieldValue
  location?: string;
  lastActivityAt?: Date | Timestamp | FieldValue; // Allow FieldValue
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
  alternateContactNumber?: string | null;
  aadhaarNumber?: string | null; // Optional
  isAnonymous?: boolean; // True for "Nakadi Kisan"
  registeredByRef: string; // UID of the user who registered this Kisan
  bakaya?: number; // Keep as number, Firestore supports it.
  createdAt: Date | Timestamp | FieldValue; // Allow FieldValue
  updatedAt: Date | Timestamp | FieldValue; // Allow FieldValue
  notes?: string; // Optional remarks by operator

  // NEW: Crops sold by this Kisan
  cropsSold?: string[] | null;

  // Data Science Fields (Optional or calculated by Cloud Functions - not handled client-side for now)
  farmingExperienceYears?: number;
  bankAccountDetails?: { accountNumber: string; ifscCode: string }; // Encrypted/masked if stored directly
  averageMonthlyVolumeKg?: number; // Calculated by CF
  totalTransactionsCount?: number; // Calculated by CF
  loyaltyScore?: number; // Calculated by DS
  lastTransactionDate?: Date | Timestamp | FieldValue; // Allow FieldValue
  preferredPaymentMethod?: string;
}

export interface Vyapari {
  id: string; // Firestore Document ID
  name: string; // MANDATORY
  address?: string | null;
  pincode?: string | null;
  village?: string | null;
  city: string | null;
  district?: string | null;
  state?: string | null;
  contactNumber?: string | null;
  hasWhatsapp?: boolean;
  isWhatsappSameAsContact?: boolean;
  whatsappNumber?: string | null;
  alternateContactNumber?: string | null;
  gstNumber?: string | null; // Changed to gstNumber from gstin for consistency with form
  isAnonymous?: boolean;
  registeredByRef: string;
  bakaya?: number;
  createdAt: Date | Timestamp | FieldValue; // Allow FieldValue
  updatedAt: Date | Timestamp | FieldValue; // Allow FieldValue
  notes?: string | null;

  // NEW: Crops bought by this Vyapari
  cropsBought?: string[] | null;

  // Data Science Fields (Optional or calculated by Cloud Functions - not handled client-side for now)
  businessType?: string; // e.g., 'Retailer', 'Wholesaler'
  areaOfOperation?: string[]; // Districts/States
  averageMonthlyVolumeKg?: number; // Calculated by CF
  totalTransactionsCount?: number; // Calculated by CF
  loyaltyScore?: number; // Calculated by DS
  lastTransactionDate?: Date | Timestamp | FieldValue; // Allow FieldValue
}

export interface Product {
  id: string; // Firestore Document ID
  name: string; // MANDATORY
  unit: string; // Always 'kg' as per discussion
  category?: string | null; // e.g., "Grain", "Vegetable"
  description?: string | null; // Optional
  defaultUnitPrice?: number | null; // MADE OPTIONAL
  active: boolean; // Is the product currently active/tradable?
  createdAt: Date | Timestamp | FieldValue; // Allow FieldValue
  updatedAt: Date | Timestamp | FieldValue; // Allow FieldValue

  // Data Science Fields (Suggested from external data, user confirmed, or calculated - not handled client-side for now)
  seasonality?: ("Rabi" | "Kharif" | "Zaid" | "Year-round")[];
  typicalYieldPerAcreKg?: number;
  shelfLifeDays?: number;
  storageRequirements?: string;
  lastUnitPriceSold?: number; // Cached by CF
  averageUnitPriceLast7Days?: number; // Calculated by CF
  averageUnitPriceLast30Days?: number; // Calculated by CF
  totalQuantitySoldKg?: number; // Calculated by CF
  marketDemandIndex?: number; // Calculated by DS
  growingRegionIndia?: string[]; // Suggested from external data

  // NEW: Price Statistics (to be populated by Cloud Functions/backend logic)
  averagePrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  medianPrice?: number | null;
  modePrice?: number | null;
}

// --- Transaction & Financial Types ---

// Define the structure of a single item within a transaction
export interface TransactionItem {
  productId: string; // Reference to the Product document ID
  productName: string; // Display name of the product (from the Product interface)
  quantity: number; // Quantity in KG
  unitPrice: number; // Price per KG
  totalPrice: number; // Calculated: quantity * unitPrice
  // unit?: string; // Optional: if you need to store the unit used for this specific item, though Product.unit is 'kg'
}

export type TransactionStatus = "pending" | "bakaya" | "paid" | "cancelled"; // Explicitly includes 'bakaya'

// Represents a complete transaction record
export interface Transaction {
  id: string;
  kisanRef: string;
  kisanName: string; // Add this for displaying the name
  vyapariRef: string;
  vyapariName: string; // Add this for displaying the name
  transactionDate: Date | Timestamp;
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

  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date | Timestamp | FieldValue; // Allow FieldValue
  updatedAt: Date | Timestamp | FieldValue; // Allow FieldValue
  notes?: string; // General transaction remarks

  // NEW: Denormalized product references for efficient querying
  productRefs?: string[] | null;

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
  paymentDate: Date | Timestamp;
  recordedByRef: string; // UID of the user who recorded the payment
  createdAt: Date | Timestamp | FieldValue; // Allow FieldValue
  updatedAt: Date | Timestamp | FieldValue; // Allow FieldValue
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
  lastUpdated: Date | Timestamp | FieldValue; // Allow FieldValue
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
  billDate: Date | Timestamp;
  periodStart: Date | Timestamp;
  periodEnd: Date | Timestamp;

  previousBakayaAmount: number; // Outstanding balance at periodStart
  totalTransactionsAmount: number; // Sum of subTotals for transactions in period
  totalPaymentsMadeForPeriod: number;
  totalCommissionKisan: number; // Sum of Kisan commission for transactions in period
  totalCommissionVyapari: number; // Sum of Vyapari commission for transactions in period

  netAmountDueFromVyapari?: number; // Final amount Vyapari owes (for Vyapari bills)
  netAmountPayableToKisan?: number; // Final amount Mandi owes Kisan (for Kisan bills)

  finalBakayaAmount: number; // The outstanding balance AFTER this bill (updates Balance.currentOutstanding)

  status: "generated" | "sent" | "paid"; // Tracking bill status
  generatedByRef: string; // UID of user who generated bill
  createdAt: Date | Timestamp | FieldValue; // Allow FieldValue
  updatedAt: Date | Timestamp | FieldValue; // Allow FieldValue
  pdfUrl?: string; // URL to archived PDF in Storage (future)
  isRevisedBill?: boolean;
  previousBillRef?: string; // Link to previous version if revised
  billPrintCount?: number;
  billSentWhatsapp?: boolean;
}

export interface ProductPriceHistoryEntry {
  timestamp: Date | Timestamp;
  price: number; // The unit price
  productRef: string; // Product ID
  transactionRef: string; // Transaction ID
  kisanRef: string; // Kisan ID who sold at this price
  vyapariRef: string; // Vyapari ID who bought at this price
  mandiRegion: string; // Copied from transaction
  weatherConditionsAtTime?: string;
  temperatureCelsius?: number;
  humidityPercent?: number;
  externalMarketPriceKg?: number; // For comparison
}

export interface SystemSettings {
  id: "mandiDefaults"; // Fixed ID for the single settings document
  commissionKisanRate: number; // e.g., 0.02 (2%)
  commissionVyapariRatePerKg: number; // e.g., 0.40
  lastBillNumber: number; // For sequential bill number generation (ideally updated via CF)
  mandiDefaults?: {
    mandiRegion: string;
    mandiName: string;
    mandiAddress: string;
    mandiContact: string;
    mandiLogoUrl?: string; // Optional URL for Mandi logo in Storage
  };
  updatedByRef: string; // UID of user who last updated settings
  updatedAt: Date | Timestamp | FieldValue; // Allow FieldValue
}

// --- Weather Data (Future External Integration - not handled client-side for now) ---
export interface DailyWeatherData {
  id: string; // e.g., "YYYY-MM-DD" + mandiRegionId
  date: Date | Timestamp;
  mandiRegion: string;
  temperatureCelsius: number;
  humidityPercent: number;
  weatherConditions: string; // e.g., "Clear", "Rain", "Cloudy"
  precipitationMm?: number;
  windSpeedKmh?: number;
  externalSource?: string;
}

// BILLING TYPES (These are the ones specifically for the bill modal, derived from other data)

export interface BillStatementSummary {
  totalWeight: number;
  totalCommission: number;
  totalAmountToKisanGross: number; // Sum of subTotal where entity is kisan
  totalAmountFromVyapariGross: number; // Sum of subTotal where entity is vyapari
  totalCashPaidToKisan: number; // Sum of amountPaidKisan from transactions
  totalCashCollectedFromVyapari: number; // Sum of amountPaidVyapari from transactions
  netAmountChangeInPeriod: number; // The net change in balance for the entity due to transactions in this period
}

export interface BillStatement {
  entityType: 'kisan' | 'vyapari';
  entityName: string;
  entityContact?: string | null; // Allow null
  entityAddress?: string | null; // Allow null
  entityGst?: string | null;     // Allow null
  statementDate: Date; // The date the statement was generated
  startDate?: Date; // Optional: if defined, statement is for this period
  endDate?: Date;   // Optional: if defined, statement is for this period

  // The bakaya of the entity immediately at the start of the `startDate`
  // If no startDate is given, this will be 0, as the statement covers all history.
  openingBalance: number;

  // All transactions for the entity within the specified date range OR all if no dates
  transactions: Transaction[];

  // The actual current bakaya of the entity from their document in the database
  currentBakaya: number;

  // Summary for the transactions included IN THIS STATEMENT
  summary: BillStatementSummary;
}

// New type for Daily Mandi Summary
export interface DailyMandiSummary {
  summaryDate: Date;
  totalTransactionsCount: number;
  totalWeightProcessed: number; // Sum of totalWeightInKg from all transactions of the day

  // Financial summary for the selected day's transactions
  dailyCollectionFromVyaparis: number; // Sum of netAmountVyapari from transactions of the day
  dailyPaymentsToKisans: number;      // Sum of amountPaidKisan from transactions of the day

  // Overall bakaya across all entities (at the end of the summaryDate)
  totalMandiOwesToKisans: number;    // Sum of all Kisan.bakaya where Mandi owes Kisan (bakaya > 0)
  totalVyaparisOweToMandi: number;   // Sum of all Vyapari.bakaya where Vyapari owes Mandi (bakaya > 0)

  netMandiBalance: number;           // totalVyaparisOweToMandi - totalMandiOwesToKisans
}
