// src/lib/firebase/firestoreService.ts

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  Timestamp,
  setDoc,
  serverTimestamp,
  writeBatch,
  FieldValue // Import FieldValue here
} from "firebase/firestore";

import { db } from "./clientApp"; // Corrected import path for db
import {
  Kisan,
  Vyapari,
  Product,
  SystemSettings,
  Transaction,
  TransactionItem,
  Payment,
  BillStatement,
  DailyMandiSummary,
  BillStatementSummary // Ensure BillStatementSummary is imported
} from "@/types";

// --- GLOBAL UTILITIES ---

export { serverTimestamp };

export function generateFirestoreId(): string {
  return doc(collection(db, '_')).id;
}

// Helper to convert Firestore Timestamp to Date recursively
const processFirestoreDataForRead = (data: any): any => {
  if (data === null || typeof data !== "object") {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map((item) => processFirestoreDataForRead(item));
  }

  const newData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      newData[key] = processFirestoreDataForRead(data[key]);
    }
  }
  return newData;
};


// =====================================================================
// Kisan Operations
// =====================================================================

const kisansCollection = collection(db, "kisans");

export async function addKisan(kisanData: Omit<Kisan, "id" | "createdAt" | "updatedAt" | "lastTransactionDate" | "cropsSold">): Promise<Kisan> {
  try {
    const docRef = await addDoc(kisansCollection, {
      ...kisanData,
      bakaya: kisanData.bakaya || 0, // Initialize bakaya for new kisan
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cropsSold: [], // Initialize cropsSold as an empty array
    });
    const newKisan = await getKisanById(docRef.id);
    if (!newKisan) throw new Error("Failed to retrieve new Kisan after adding.");
    return newKisan;
  } catch (error) {
    console.error("Error adding Kisan:", error);
    throw new Error("Failed to add Kisan.");
  }
}

export async function getKisans(): Promise<Kisan[]> {
  try {
    const q = query(kisansCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...(processFirestoreDataForRead(data) as Omit<Kisan, "id">) } as Kisan;
    });
  } catch (error) {
    console.error("Error fetching Kisans:", error);
    throw new Error("Failed to fetch Kisans.");
  }
}

export async function getKisanById(id: string): Promise<Kisan | null> {
  try {
    const docRef = doc(db, "kisans", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id: docSnap.id, ...(processFirestoreDataForRead(data) as Omit<Kisan, "id">) } as Kisan;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Kisan with ID ${id}:`, error);
    throw new Error(`Failed to fetch Kisan with ID ${id}.`);
  }
}

export async function updateKisan(id: string, updates: Partial<Omit<Kisan, "id" | "createdAt">>): Promise<void> {
  try {
    const kisanRef = doc(db, "kisans", id);
    await updateDoc(kisanRef, { ...updates, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error(`Error updating Kisan with ID ${id}:`, error);
    throw new Error(`Failed to update Kisan with ID ${id}.`);
  }
}

export async function deleteKisan(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "kisans", id));
  } catch (error) {
    console.error(`Error deleting Kisan with ID ${id}:`, error);
    throw new Error(`Failed to delete Kisan with ID ${id}.`);
  }
}

/**
 * Batch updates multiple Kisan documents.
 * @param kisanIds An array of Kisan document IDs to update.
 * @param updates A partial Kisan object containing the fields to update.
 */
export async function batchUpdateKisans(kisanIds: string[], updates: Partial<Omit<Kisan, 'id' | 'createdAt'>>): Promise<void> {
  if (kisanIds.length === 0) {
    console.warn("No Kisan IDs provided for batch update.");
    return;
  }
  const batch = writeBatch(db);
  kisanIds.forEach(id => {
    const kisanRef = doc(db, 'kisans', id);
    batch.update(kisanRef, { ...updates, updatedAt: serverTimestamp() });
  });
  try {
    await batch.commit();
    console.log(`Batch updated ${kisanIds.length} Kisans successfully.`);
  } catch (error) {
    console.error("Error batch updating Kisans:", error);
    throw new Error("Failed to batch update Kisans.");
  }
}


// =====================================================================
// Vyapari Operations
// =====================================================================

const vyaparisCollection = collection(db, "vyaparis");

export async function addVyapari(vyapariData: Omit<Vyapari, "id" | "createdAt" | "updatedAt" | "lastTransactionDate" | "cropsBought">): Promise<Vyapari> {
  try {
    const docRef = await addDoc(vyaparisCollection, {
      ...vyapariData,
      bakaya: vyapariData.bakaya || 0, // Initialize bakaya for new vyapari
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cropsBought: [], // Initialize cropsBought as an empty array
    });
    const newVyapari = await getVyapariById(docRef.id);
    if (!newVyapari) throw new Error("Failed to retrieve new Vyapari after adding.");
    return newVyapari;
  } catch (error) {
    console.error("Error adding Vyapari:", error);
    throw new Error("Failed to add Vyapari.");
  }
}

export async function getVyaparis(): Promise<Vyapari[]> {
  try {
    const q = query(vyaparisCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...(processFirestoreDataForRead(data) as Omit<Vyapari, "id">) } as Vyapari;
    });
  } catch (error) {
    console.error("Error fetching Vyaparis:", error);
    throw new Error("Failed to fetch Vyaparis.");
  }
}

export async function getVyapariById(id: string): Promise<Vyapari | null> {
  try {
    const docRef = doc(db, "vyaparis", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id: docSnap.id, ...(processFirestoreDataForRead(data) as Omit<Vyapari, "id">) } as Vyapari;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Vyapari with ID ${id}:`, error);
    throw new Error(`Failed to fetch Vyapari with ID ${id}.`);
  }
}

export async function updateVyapari(id: string, updates: Partial<Omit<Vyapari, "id" | "createdAt">>): Promise<void> {
  try {
    const vyapariRef = doc(db, "vyaparis", id);
    await updateDoc(vyapariRef, { ...updates, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error(`Error updating Vyapari with ID ${id}:`, error);
    throw new Error(`Failed to update Vyapari with ID ${id}.`);
  }
}

export async function deleteVyapari(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "vyaparis", id));
  } catch (error) {
    console.error(`Error deleting Vyapari with ID ${id}:`, error);
    throw new Error(`Failed to delete Vyapari with ID ${id}.`);
  }
}

/**
 * Batch updates multiple Vyapari documents.
 * @param vyapariIds An array of Vyapari document IDs to update.
 * @param updates A partial Vyapari object containing the fields to update.
 */
export async function batchUpdateVyaparis(vyapariIds: string[], updates: Partial<Omit<Vyapari, 'id' | 'createdAt'>>): Promise<void> {
  if (vyapariIds.length === 0) {
    console.warn("No Vyapari IDs provided for batch update.");
    return;
  }
  const batch = writeBatch(db);
  vyapariIds.forEach(id => {
    const vyapariRef = doc(db, 'vyaparis', id);
    batch.update(vyapariRef, { ...updates, updatedAt: serverTimestamp() });
  });
  try {
    await batch.commit();
    console.log(`Batch updated ${vyapariIds.length} Vyaparis successfully.`);
  } catch (error) {
    console.error("Error batch updating Vyaparis:", error);
    throw new Error("Failed to batch update Vyaparis.");
  }
}

// =====================================================================
// Product Operations
// =====================================================================

const productsCollection = collection(db, "products");

export async function addProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  try {
    const docRef = await addDoc(productsCollection, {
      ...productData,
      active: productData.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newProduct = await getProductById(docRef.id);
    if (!newProduct) throw new Error("Failed to retrieve new Product after adding.");
    return newProduct;
  } catch (error) {
    console.error("Error adding Product:", error);
    throw new Error("Failed to add Product.");
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const q = query(productsCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...(processFirestoreDataForRead(data) as Omit<Product, "id">) } as Product;
    });
  } catch (error) {
    console.error("Error fetching Products:", error);
    throw new Error("Failed to fetch Products.");
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id: docSnap.id, ...(processFirestoreDataForRead(data) as Omit<Product, "id">) } as Product;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Product with ID ${id}:`, error);
    throw new Error(`Failed to fetch Product with ID ${id}.`);
  }
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, "id" | "createdAt">>): Promise<void> {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, { ...updates, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error(`Error updating Product with ID ${id}:`, error);
    throw new Error(`Failed to update Product with ID ${id}.`);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (error) {
    console.error(`Error deleting Product with ID ${id}:`, error);
    throw new Error(`Failed to delete Product with ID ${id}.`);
  }
}

/**
 * Batch updates multiple Product documents.
 * @param productIds An array of Product document IDs to update.
 * @param updates A partial Product object containing the fields to update.
 */
export async function batchUpdateProducts(productIds: string[], updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
  if (productIds.length === 0) {
    console.warn("No Product IDs provided for batch update.");
    return;
  }
  const batch = writeBatch(db);
  productIds.forEach(id => {
    const productRef = doc(db, 'products', id);
    batch.update(productRef, { ...updates, updatedAt: serverTimestamp() });
  });
  try {
    await batch.commit();
    console.log(`Batch updated ${productIds.length} Products successfully.`);
  } catch (error) {
    console.error("Error batch updating Products:", error);
    throw new Error("Failed to batch update Products.");
  }
}

// =====================================================================
// System Settings Operations
// =====================================================================

const systemSettingsCollection = collection(db, "systemSettings");

export async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const docRef = doc(systemSettingsCollection, "mandiDefaults");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(processFirestoreDataForRead(data) as Omit<SystemSettings, "id">),
      } as SystemSettings;
    } else {
      console.warn(
        "No 'mandiDefaults' document found in 'systemSettings' collection. Please ensure it is created with default values."
      );
      return null;
    }
  } catch (error) {
    console.error("Error fetching System Settings:", error);
    throw new Error("Failed to fetch System Settings.");
  }
}

export async function updateSystemSettings(settingsData: Partial<Omit<SystemSettings, "id" | "updatedAt">>): Promise<void> {
  try {
    const docRef = doc(systemSettingsCollection, "mandiDefaults");
    await updateDoc(docRef, { ...settingsData, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error("Error updating System Settings:", error);
    throw new Error("Failed to update System Settings.");
  }
}

// =====================================================================
// Transaction Operations
// =====================================================================

export const transactionsCollection = collection(db, "transactions");

// Updated AddTransactionData interface to match the new Transaction type
export interface AddTransactionData {
  transactionDate: Date;
  kisanRef: string;
  vyapariRef: string;
  items: Omit<TransactionItem, 'productName' | 'totalPrice'>[]; // Items without productName and totalPrice (calculated)
  commissionKisanRate: number;
  commissionVyapariRatePerKg: number;
  amountPaidKisan: number; // Cash paid to kisan at the time of transaction
  amountPaidVyapari: number; // Cash collected from Vyapari at the time of transaction
  notes?: string;
  mandiRegion: string; // Mandatory now as per Transaction type
  transactionType: "sale_to_vyapari" | "purchase_from_kisan" | "return_vyapari" | "return_kisan";
  recordedByRef: string; // UID of the user who recorded the transaction
}


export async function addTransaction(data: AddTransactionData): Promise<Transaction> {
  return runTransaction(db, async (transaction) => {
    // 1. Fetch Kisan and Vyapari docs to get current bakaya and names
    const kisanDocRef = doc(db, "kisans", data.kisanRef);
    const vyapariDocRef = doc(db, "vyaparis", data.vyapariRef);

    const kisanDoc = await transaction.get(kisanDocRef);
    const vyapariDoc = await transaction.get(vyapariDocRef);

    if (!kisanDoc.exists()) {
      throw new Error(`Kisan with ID ${data.kisanRef} not found.`);
    }
    if (!vyapariDoc.exists()) {
      throw new Error(`Vyapari with ID ${data.vyapariRef} not found.`);
    }

    const kisanData = processFirestoreDataForRead(kisanDoc.data()) as Kisan;
    const vyapariData = processFirestoreDataForRead(vyapariDoc.data()) as Vyapari;

    // 2. Process items to calculate totals and amounts
    let subTotal = 0; // Sum of totalPrice for all items
    let totalWeightInKg = 0;
    const processedItems: TransactionItem[] = [];
    const productRefs: string[] = [];

    for (const item of data.items) {
      // Explicitly cast item to ensure productId is recognized
      const transactionItemWithProductId = item as { productId: string; quantity: number; unitPrice: number; };

      const productDocRef = doc(db, "products", transactionItemWithProductId.productId);
      const productDoc = await transaction.get(productDocRef);
      if (!productDoc.exists()) {
        throw new Error(`Product with ID ${transactionItemWithProductId.productId} not found.`);
      }
      const productData = processFirestoreDataForRead(productDoc.data()) as Product;

      const totalPrice = transactionItemWithProductId.quantity * transactionItemWithProductId.unitPrice;

      subTotal += totalPrice;
      totalWeightInKg += transactionItemWithProductId.quantity; // Assuming quantity is already in Kg as per Product.unit is 'kg'

      processedItems.push({
        productId: transactionItemWithProductId.productId, // Ensure productId is here
        productName: productData.name,
        quantity: transactionItemWithProductId.quantity,
        unitPrice: transactionItemWithProductId.unitPrice,
        totalPrice: totalPrice,
      });
      productRefs.push(transactionItemWithProductId.productId);
    }

    // 3. Calculate commissions
    const commissionKisanAmount = subTotal * (data.commissionKisanRate / 100);
    const commissionVyapariAmount = totalWeightInKg * data.commissionVyapariRatePerKg;
    const totalCommission = commissionKisanAmount + commissionVyapariAmount; // Sum of both commissions

    // 4. Determine net amounts
    // Net amount Mandi owes Kisan after all deductions/payments
    const netAmountKisan = subTotal - commissionKisanAmount - data.amountPaidKisan;

    // Net amount Vyapari owes Mandi after all deductions/payments
    const netAmountVyapari = subTotal + commissionVyapariAmount - data.amountPaidVyapari;

    // 5. Update Kisan and Vyapari bakaya
    // Kisan bakaya: Mandi owes Kisan (positive value).
    // If netAmountKisan is positive, Mandi still owes Kisan.
    // If netAmountKisan is negative, Kisan owes Mandi (Mandi overpaid or Kisan returned goods).
    const newKisanBakaya = (kisanData.bakaya || 0) + netAmountKisan; // Use || 0
    // Vyapari bakaya: Vyapari owes Mandi (positive value).
    // If netAmountVyapari is positive, Vyapari still owes Mandi.
    // If netAmountVyapari is negative, Mandi owes Vyapari (Vyapari overpaid or returned goods).
    const newVyapariBakaya = (vyapariData.bakaya || 0) + netAmountVyapari; // Use || 0

    transaction.update(kisanDocRef, {
      bakaya: newKisanBakaya,
      updatedAt: serverTimestamp(),
      cropsSold: Array.from(new Set([...(kisanData.cropsSold || []), ...processedItems.map(item => item.productName)]))
    });

    transaction.update(vyapariDocRef, {
      bakaya: newVyapariBakaya,
      updatedAt: serverTimestamp(),
      cropsBought: Array.from(new Set([...(vyapariData.cropsBought || []), ...processedItems.map(item => item.productName)]))
    });

    // 6. Create the new transaction record
    const newTransaction: Omit<Transaction, "id"> = {
      transactionDate: Timestamp.fromDate(data.transactionDate),
      kisanRef: data.kisanRef,
      kisanName: kisanData.name,
      vyapariRef: data.vyapariRef,
      vyapariName: vyapariData.name,
      recordedByRef: data.recordedByRef,
      items: processedItems,
      subTotal: subTotal,
      totalWeightInKg: totalWeightInKg,
      commissionKisanRate: data.commissionKisanRate,
      commissionKisanAmount: commissionKisanAmount, // Ensure this is included
      commissionVyapariRatePerKg: data.commissionVyapariRatePerKg,
      commissionVyapariAmount: commissionVyapariAmount, // Ensure this is included
      totalCommission: totalCommission, // Ensure this is included
      netAmountKisan: netAmountKisan,
      netAmountVyapari: netAmountVyapari,
      amountPaidKisan: data.amountPaidKisan,
      amountPaidVyapari: data.amountPaidVyapari,
      status: 'completed', // Default to completed for new transactions
      createdAt: serverTimestamp(), // Correctly assign FieldValue
      updatedAt: serverTimestamp(), // Correctly assign FieldValue
      notes: data.notes,
      productRefs: productRefs,
      mandiRegion: data.mandiRegion,
      transactionType: data.transactionType,
    };

    const transactionDocRef = doc(collection(db, "transactions"));
    transaction.set(transactionDocRef, newTransaction);

    const createdTransaction = { id: transactionDocRef.id, ...newTransaction } as Transaction;
    // Convert Timestamps to Dates for the returned object
    createdTransaction.transactionDate = (createdTransaction.transactionDate as Timestamp).toDate();
    // createdAt and updatedAt might be FieldValue initially, convert only if they are Timestamp
    if (createdTransaction.createdAt instanceof Timestamp) {
      createdTransaction.createdAt = createdTransaction.createdAt.toDate();
    }
    if (createdTransaction.updatedAt instanceof Timestamp) {
      createdTransaction.updatedAt = createdTransaction.updatedAt.toDate();
    }

    return createdTransaction;
  });
}

export interface TransactionFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  kisanRef?: string | null;
  vyapariRef?: string | null;
  productRef?: string | null;
  limit?: number; // Not used in current getTransactions but useful for pagination
  lastDocId?: string; // Not used in current getTransactions but useful for pagination
}

export async function getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  try {
    let q: any = collection(db, "transactions");

    if (filters.startDate) {
      q = query(q, where("transactionDate", ">=", Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      const endDateInclusive = new Date(filters.endDate);
      endDateInclusive.setHours(23, 59, 59, 999);
      q = query(q, where("transactionDate", "<=", Timestamp.fromDate(endDateInclusive)));
    }
    if (filters.kisanRef) {
      q = query(q, where("kisanRef", "==", filters.kisanRef));
    }
    if (filters.vyapariRef) {
      q = query(q, where("vyapariRef", "==", filters.vyapariRef));
    }
    if (filters.productRef) {
      q = query(q, where("productRefs", "array-contains", filters.productRef));
    }

    q = query(q, orderBy("transactionDate", "desc"), orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);

    console.log("Firestore Query Constructed:", q);

    return querySnapshot.docs.map((transactionDoc) => {
      const data = transactionDoc.data();
      const processedData = processFirestoreDataForRead(data);

      return {
        id: transactionDoc.id,
        ...processedData,
      } as Transaction;
    });
  } catch (error) {
    console.error("Error fetching Transactions with filters:", error);
    throw new Error("Failed to fetch Transactions.");
  }
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  try {
    const transactionDocRef = doc(db, "transactions", id);
    const docSnap = await getDoc(transactionDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const processedData = processFirestoreDataForRead(data);

      return {
        id: docSnap.id,
        ...processedData,
      } as Transaction;
    } else {
      console.log(`No transaction found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching Transaction with ID ${id}:`, error);
    throw new Error(`Failed to fetch Transaction with ID ${id}.`);
  }
}

export async function updateTransaction(
  id: string,
  transactionData: Partial<Omit<Transaction, "id" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, "transactions", id);
    const updatePayload: any = {
      ...transactionData,
      updatedAt: serverTimestamp(),
    };

    if (transactionData.transactionDate instanceof Date) {
      updatePayload.transactionDate = Timestamp.fromDate(
        transactionData.transactionDate
      );
    }

    await updateDoc(docRef, updatePayload);
  } catch (error) {
    console.error(`Error updating Transaction with ID ${id}:`, error);
    throw new Error(`Failed to update Transaction with ID ${id}.`);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  return runTransaction(db, async (transaction) => {
    const transactionRef = doc(db, "transactions", id);
    const transactionDoc = await transaction.get(transactionRef);

    if (!transactionDoc.exists()) {
      throw new Error(`Transaction with ID ${id} not found.`);
    }

    const transactionData = processFirestoreDataForRead(transactionDoc.data()) as Transaction;

    // Revert bakaya for Kisan
    const kisanRef = doc(db, "kisans", transactionData.kisanRef);
    const kisanDoc = await transaction.get(kisanRef);
    if (kisanDoc.exists()) {
      const currentKisanBakaya = (processFirestoreDataForRead(kisanDoc.data()) as Kisan).bakaya || 0;
      // Revert: subtract what Mandi was going to owe Kisan, add back what was paid
      const newKisanBakaya = currentKisanBakaya - transactionData.netAmountKisan;
      transaction.update(kisanRef, { bakaya: newKisanBakaya, updatedAt: serverTimestamp() });
    }

    // Revert bakaya for Vyapari
    const vyapariRef = doc(db, "vyaparis", transactionData.vyapariRef);
    const vyapariDoc = await transaction.get(vyapariRef);
    if (vyapariDoc.exists()) {
      const currentVyapariBakaya = (processFirestoreDataForRead(vyapariDoc.data()) as Vyapari).bakaya || 0;
      // Revert: subtract what Vyapari was going to owe Mandi, add back what was paid
      const newVyapariBakaya = currentVyapariBakaya - transactionData.netAmountVyapari;
      transaction.update(vyapariRef, { bakaya: newVyapariBakaya, updatedAt: serverTimestamp() });
    }

    // Delete the transaction
    transaction.delete(transactionRef);
  });
}

/**
 * Batch updates multiple Transaction documents.
 * @param transactionIds An array of Transaction document IDs to update.
 * @param updates A partial Transaction object containing the fields to update.
 */
export async function batchUpdateTransactions(transactionIds: string[], updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<void> {
  if (transactionIds.length === 0) {
    console.warn("No Transaction IDs provided for batch update.");
    return;
  }
  const batch = writeBatch(db);
  transactionIds.forEach(id => {
    const transactionRef = doc(db, 'transactions', id);
    // Convert Date objects in updates to Timestamps if present
    const updatePayload: any = { ...updates, updatedAt: serverTimestamp() };
    if (updatePayload.transactionDate instanceof Date) {
      updatePayload.transactionDate = Timestamp.fromDate(updatePayload.transactionDate);
    }
    batch.update(transactionRef, updatePayload);
  });
  try {
    await batch.commit();
    console.log(`Batch updated ${transactionIds.length} Transactions successfully.`);
  } catch (error) {
    console.error("Error batch updating Transactions:", error);
    throw new Error("Failed to batch update Transactions.");
  }
}


// =====================================================================
// Payment Operations
// =====================================================================

const paymentsCollection = collection(db, "payments");

export async function addPayment(
  paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Payment> {
  const batch = writeBatch(db);
  const paymentRef = doc(paymentsCollection); // Let Firestore generate ID

  // Add payment document to batch
  batch.set(paymentRef, {
    ...paymentData,
    paymentDate: Timestamp.fromDate(paymentData.paymentDate as Date), // Convert Date to Timestamp
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    id: paymentRef.id, // Add the generated ID to the document
  });

  // Update entity's bakaya (Kisan or Vyapari)
  const entityCollectionName = paymentData.entityType === 'kisan' ? 'kisans' : 'vyaparis';
  const entityRef = doc(db, entityCollectionName, paymentData.entityRef);
  const entitySnap = await getDoc(entityRef);

  if (entitySnap.exists()) {
    const currentBakaya = (processFirestoreDataForRead(entitySnap.data()) as Kisan | Vyapari).bakaya || 0;
    let newBakaya = currentBakaya;

    if (paymentData.entityType === 'kisan') {
      // Payment from Mandi to Kisan. This reduces Mandi's debt (makes bakaya less positive or more negative).
      // So, we subtract the amount from the current bakaya (if Mandi owes Kisan).
      // If Kisan owes Mandi (bakaya negative), payment from Mandi to Kisan makes bakaya more negative.
      newBakaya = currentBakaya - paymentData.amount;
    } else if (paymentData.entityType === 'vyapari') {
      // Payment from Vyapari to Mandi. This reduces Vyapari's debt (makes bakaya less positive or more negative).
      // So, we subtract the amount from the current bakaya.
      newBakaya = currentBakaya - paymentData.amount;
    }

    batch.update(entityRef, { bakaya: newBakaya, updatedAt: serverTimestamp() });
  } else {
    console.warn(`Entity with ID ${paymentData.entityRef} and type ${paymentData.entityType} not found for bakaya update.`);
  }

  try {
    await batch.commit();
    const newPaymentDoc = await getDoc(paymentRef); // Fetch the newly added payment document
    if (!newPaymentDoc.exists()) throw new Error("Failed to retrieve new Payment after adding.");
    return {
      id: newPaymentDoc.id,
      ...processFirestoreDataForRead(newPaymentDoc.data())
    } as Payment;
  } catch (error) {
    console.error("Error committing payment batch:", error);
    throw new Error("Failed to add Payment and update balances.");
  }
};

export async function getPayments(entityType: 'kisan' | 'vyapari', entityRef: string, startDate?: Date, endDate?: Date): Promise<Payment[]> {
  try {
    let q: any = query(
      paymentsCollection,
      where('entityType', '==', entityType),
      where('entityRef', '==', entityRef)
    );

    if (startDate) {
      q = query(q, where('paymentDate', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      const endDateInclusive = new Date(endDate);
      endDateInclusive.setHours(23, 59, 59, 999);
      q = query(q, where('paymentDate', '<=', Timestamp.fromDate(endDateInclusive)));
    }

    q = query(q, orderBy('paymentDate', 'asc')); // Order payments chronologically

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(processFirestoreDataForRead(doc.data()) as Omit<Payment, 'id'>)
    }) as Payment);
  } catch (error) {
    console.error(`Error fetching Payments for ${entityType} ${entityRef}:`, error);
    throw new Error(`Failed to fetch Payments for ${entityType}.`);
  }
};

// =====================================================================
// Bill Generation Operations (Updated)
// =====================================================================

export interface GetBillStatementOptions {
  entityType: 'kisan' | 'vyapari';
  entityId: string;
  startDate?: Date; // Optional: if provided, filters transactions within range
  endDate?: Date;   // Optional: if provided, filters transactions within range
}

export async function getBillStatement(options: GetBillStatementOptions): Promise<BillStatement> {
  const { entityType, entityId, startDate, endDate } = options;

  let entityDoc: Kisan | Vyapari | null = null;
  if (entityType === 'kisan') {
    entityDoc = await getKisanById(entityId);
  } else { // 'vyapari'
    entityDoc = await getVyapariById(entityId);
  }

  if (!entityDoc) {
    throw new Error(`${entityType === 'kisan' ? 'Kisan' : 'Vyapari'} with ID ${entityId} not found.`);
  }

  const transactionFilters: TransactionFilters = {};
  if (entityType === 'kisan') {
    transactionFilters.kisanRef = entityId;
  } else {
    transactionFilters.vyapariRef = entityId;
  }

  let transactionsForStatement: Transaction[] = [];
  let paymentsForStatement: Payment[] = [];
  let openingBalance = 0;

  if (startDate && endDate) {
    // Case: Specific date range for individual entity
    // Get transactions within the specified period
    transactionFilters.startDate = startDate;
    transactionFilters.endDate = endDate;
    transactionsForStatement = await getTransactions(transactionFilters);

    // Get payments within the specified period
    paymentsForStatement = await getPayments(entityType, entityId, startDate, endDate);

    // Calculate opening balance for the period (bakaya just BEFORE startDate)
    // This is the current bakaya, adjusted by reversing transactions/payments within the period.
    const currentEntityDoc = await getDoc(doc(db, entityType === 'kisan' ? 'kisans' : 'vyaparis', entityId));
    let bakayaAtStartOfPeriod = (processFirestoreDataForRead(currentEntityDoc.data()) as Kisan | Vyapari).bakaya || 0;

    // Reverse transactions within the period
    transactionsForStatement.forEach(txn => {
      if (entityType === 'kisan') {
        // Mandi owes Kisan: +netAmountKisan. Mandi pays: -amountPaidKisan.
        // To get balance BEFORE this txn, subtract netAmountKisan, add amountPaidKisan.
        bakayaAtStartOfPeriod -= txn.netAmountKisan;
      } else { // vyapari
        // Vyapari owes Mandi: +netAmountVyapari. Vyapari pays: -amountPaidVyapari.
        // To get balance BEFORE this txn, subtract netAmountVyapari, add amountPaidVyapari.
        bakayaAtStartOfPeriod -= txn.netAmountVyapari;
      }
    });

    // Reverse payments within the period
    paymentsForStatement.forEach(payment => {
      if (entityType === 'kisan') {
        // Payment from Mandi to Kisan: Mandi's debt to Kisan decreases.
        // To get balance BEFORE this payment, add the amount back.
        bakayaAtStartOfPeriod += payment.amount;
      } else { // vyapari
        // Payment from Vyapari to Mandi: Vyapari's debt to Mandi decreases.
        // To get balance BEFORE this payment, add the amount back.
        bakayaAtStartOfPeriod += payment.amount;
      }
    });
    openingBalance = bakayaAtStartOfPeriod;

  } else {
    // Case: No specific date range, fetch all transactions for the individual entity (all past bakayas)
    transactionsForStatement = await getTransactions(transactionFilters);
    paymentsForStatement = await getPayments(entityType, entityId); // Get all payments for the entity
    openingBalance = 0; // When showing all history, statement effectively starts from 0
  }

  // Sort transactions chronologically for statement display
  transactionsForStatement.sort((a, b) => (a.transactionDate as Date).getTime() - (b.transactionDate as Date).getTime());


  // Recalculate summary metrics for the transactions included in this specific statement
  const summary = transactionsForStatement.reduce(
    (acc, trans) => {
      acc.totalWeight += trans.totalWeightInKg;
      acc.totalCommission += trans.totalCommission; // Sum totalCommission
      acc.totalAmountToKisanGross += trans.subTotal; // subTotal is gross amount for kisan
      acc.totalAmountFromVyapariGross += trans.subTotal; // subTotal is gross amount from vyapari
      acc.totalCashPaidToKisan += trans.amountPaidKisan;
      acc.totalCashCollectedFromVyapari += trans.amountPaidVyapari; // Added for completeness in summary

      if (entityType === 'kisan') {
          acc.netAmountChangeInPeriod += trans.netAmountKisan;
      } else { // vyapari
          acc.netAmountChangeInPeriod += trans.netAmountVyapari;
      }
      return acc;
    },
    {
      totalWeight: 0,
      totalCommission: 0,
      totalAmountToKisanGross: 0,
      totalAmountFromVyapariGross: 0,
      totalCashPaidToKisan: 0,
      totalCashCollectedFromVyapari: 0, // Initialize
      netAmountChangeInPeriod: 0,
    }
  );

  return {
    entityType,
    entityName: entityDoc.name,
    entityContact: entityDoc.contactNumber || null, // Ensure null if undefined
    entityAddress: entityType === 'kisan' ? (entityDoc as Kisan).village || null : (entityDoc as Vyapari).city || null, // Ensure null if undefined
    entityGst: entityType === 'vyapari' ? (entityDoc as Vyapari).gstNumber || null : null, // Ensure null if undefined
    statementDate: new Date(),
    startDate: startDate,
    endDate: endDate,
    openingBalance: parseFloat(openingBalance.toFixed(2)),
    transactions: transactionsForStatement,
    currentBakaya: parseFloat((entityDoc.bakaya || 0).toFixed(2)), // The actual current bakaya from DB (final balance)
    summary: summary,
  };
}


// =====================================================================
// Daily Mandi Summary (New Operation)
// =====================================================================

export async function getDailyMandiSummary(summaryDate: Date): Promise<DailyMandiSummary> {
  // Normalize date to start and end of the day
  const startOfDay = new Date(summaryDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(summaryDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Get all transactions for the specified day
  const dailyTransactionsQuery = query(
    collection(db, "transactions"),
    where("transactionDate", ">=", Timestamp.fromDate(startOfDay)),
    where("transactionDate", "<=", Timestamp.fromDate(endOfDay))
  );
  const dailyTransactionsSnap = await getDocs(dailyTransactionsQuery);
  const dailyTransactions: Transaction[] = dailyTransactionsSnap.docs.map(doc => {
      const data = doc.data() as Omit<Transaction, "id">;
      return { id: doc.id, ...processFirestoreDataForRead(data) } as Transaction;
  });

  // 2. Calculate daily financial summaries from these transactions
  let totalTransactionsCount = dailyTransactions.length;
  let totalWeightProcessed = 0;
  let dailyCollectionFromVyaparis = 0; // Sum of netAmountVyapari from transactions of the day
  let dailyPaymentsToKisans = 0;      // Sum of amountPaidKisan from transactions of the day

  dailyTransactions.forEach(t => {
    totalWeightProcessed += t.totalWeightInKg;
    // For daily summary, we care about actual cash flow and net amounts for the day
    dailyCollectionFromVyaparis += t.netAmountVyapari + t.amountPaidVyapari; // Total amount Vyapari was liable for (net + paid)
    dailyPaymentsToKisans += t.amountPaidKisan; // Only cash paid at transaction time
  });

  // 3. Get current bakaya for all Kisans and Vyaparis (overall, not just for the day)
  const kisansSnap = await getDocs(collection(db, "kisans"));
  let totalMandiOwesToKisans = 0;
  kisansSnap.docs.forEach(docSnap => {
    const kisan = processFirestoreDataForRead(docSnap.data()) as Kisan;
    // Kisan.bakaya: positive means Mandi owes Kisan
    if (kisan.bakaya && kisan.bakaya > 0) { // Sum only positive bakayas (what Mandi actually owes)
      totalMandiOwesToKisans += kisan.bakaya;
    }
  });

  const vyaparisSnap = await getDocs(collection(db, "vyaparis"));
  let totalVyaparisOweToMandi = 0;
  vyaparisSnap.docs.forEach(docSnap => {
    const vyapari = processFirestoreDataForRead(docSnap.data()) as Vyapari;
    // Vyapari.bakaya: positive means Vyapari owes Mandi
    if (vyapari.bakaya && vyapari.bakaya > 0) { // Sum only positive bakayas (what Vyaparis actually owe)
      totalVyaparisOweToMandi += vyapari.bakaya;
    }
  });

  // Net Mandi position = Total Vyapari Debt - Total Kisan Credit
  const netMandiBalance = totalVyaparisOweToMandi - totalMandiOwesToKisans;

  return {
    summaryDate: summaryDate,
    totalTransactionsCount: totalTransactionsCount,
    totalWeightProcessed: parseFloat(totalWeightProcessed.toFixed(2)),
    dailyCollectionFromVyaparis: parseFloat(dailyCollectionFromVyaparis.toFixed(2)),
    dailyPaymentsToKisans: parseFloat(dailyPaymentsToKisans.toFixed(2)),
    totalMandiOwesToKisans: parseFloat(totalMandiOwesToKisans.toFixed(2)),
    totalVyaparisOweToMandi: parseFloat(totalVyaparisOweToMandi.toFixed(2)),
    netMandiBalance: parseFloat(netMandiBalance.toFixed(2)),
  };
}
