// src/lib/firebase/firestoreService.ts

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentData,
  orderBy,
  limit,
  Timestamp,
  setDoc,
  serverTimestamp,
  writeBatch, // Import writeBatch
} from "firebase/firestore";

import { db } from "./clientApp"; // Import the initialized Firestore instance
import { Kisan, Vyapari, Product, SystemSettings, Transaction, Payment } from "@/types"; // Import Payment type

// --- GLOBAL UTILITIES (Required by other files like add/page.tsx) ---

// Re-export serverTimestamp directly for convenience in other modules
export { serverTimestamp };

// Function to generate a new Firestore document ID locally
export function generateFirestoreId(): string {
  // This generates a new ID without creating a document.
  // Using a dummy collection name like '_' is a common practice for this.
  return doc(collection(db, '_')).id;
}

// --- Helper for converting Firestore Timestamps to JavaScript Dates recursively ---
// This function deep-scans an object or array and converts all Firestore Timestamp instances to Date objects.
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

  // Handle plain objects
  const newData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      newData[key] = processFirestoreDataForRead(data[key]);
    }
  }
  return newData;
};

// --- Kisan Operations ---
const kisansCollection = collection(db, "kisans");

export const getKisans = async (): Promise<Kisan[]> => {
  try {
    const q = query(kisansCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Apply the recursive conversion helper
      return {
        id: doc.id,
        ...(processFirestoreDataForRead(data) as Omit<Kisan, "id">),
      } as Kisan;
    });
  } catch (error) {
    console.error("Error fetching Kisans:", error);
    throw new Error("Failed to fetch Kisans.");
  }
};

export const getKisanById = async (id: string): Promise<Kisan | null> => {
  try {
    const docRef = doc(db, "kisans", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(processFirestoreDataForRead(data) as Omit<Kisan, "id">),
      } as Kisan;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Kisan with ID ${id}:`, error);
    throw new Error(`Failed to fetch Kisan with ID ${id}.`);
  }
};

export const addKisan = async (
  kisanData: Omit<Kisan, "id" | "createdAt" | "updatedAt" | "lastTransactionDate" | "cropsSold">
): Promise<Kisan> => { // Changed return type to Promise<Kisan>
  try {
    const docRef = await addDoc(kisansCollection, {
      ...kisanData,
      bakaya: kisanData.bakaya || 0, // Ensure bakaya is initialized
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cropsSold: [], // Initialize cropsSold as an empty array
    });
    const newKisan = await getKisanById(docRef.id); // Fetch the newly added Kisan
    if (!newKisan) throw new Error("Failed to retrieve new Kisan after adding.");
    return newKisan;
  } catch (error) {
    console.error("Error adding Kisan:", error);
    throw new Error("Failed to add Kisan.");
  }
};

export const updateKisan = async (
  id: string,
  kisanData: Partial<Omit<Kisan, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, "kisans", id);
    await updateDoc(docRef, {
      ...kisanData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating Kisan with ID ${id}:`, error);
    throw new Error(`Failed to update Kisan with ID ${id}.`);
  }
};

export const deleteKisan = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "kisans", id));
  } catch (error) {
    console.error(`Error deleting Kisan with ID ${id}:`, error);
    throw new Error(`Failed to delete Kisan with ID ${id}.`);
  }
};


// --- Vyapari Operations ---
const vyaparisCollection = collection(db, "vyaparis");

export const getVyaparis = async (): Promise<Vyapari[]> => {
  try {
    const q = query(vyaparisCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...(processFirestoreDataForRead(data) as Omit<Vyapari, "id">),
      } as Vyapari;
    });
  } catch (error) {
    console.error("Error fetching Vyaparis:", error);
    throw new Error("Failed to fetch Vyaparis.");
  }
};

export const getVyapariById = async (id: string): Promise<Vyapari | null> => {
  try {
    const docRef = doc(db, "vyaparis", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(processFirestoreDataForRead(data) as Omit<Vyapari, "id">),
      } as Vyapari;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Vyapari with ID ${id}:`, error);
    throw new Error(`Failed to fetch Vyapari with ID ${id}.`);
  }
};

export const addVyapari = async (
  vyapariData: Omit<Vyapari, "id" | "createdAt" | "updatedAt" | "lastTransactionDate" | "cropsBought">
): Promise<Vyapari> => { // Changed return type to Promise<Vyapari>
  try {
    const docRef = await addDoc(vyaparisCollection, {
      ...vyapariData,
      bakaya: vyapariData.bakaya || 0, // Ensure bakaya is initialized
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      cropsBought: [], // Initialize cropsBought as an empty array
    });
    const newVyapari = await getVyapariById(docRef.id); // Fetch the newly added Vyapari
    if (!newVyapari) throw new Error("Failed to retrieve new Vyapari after adding.");
    return newVyapari;
  } catch (error) {
    console.error("Error adding Vyapari:", error);
    throw new Error("Failed to add Vyapari.");
  }
};

export const updateVyapari = async (
  id: string,
  vyapariData: Partial<Omit<Vyapari, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, "vyaparis", id);
    await updateDoc(docRef, {
      ...vyapariData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating Vyapari with ID ${id}:`, error);
    throw new Error(`Failed to update Vyapari with ID ${id}.`);
  }
};

export const deleteVyapari = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "vyaparis", id));
  } catch (error) {
    console.error(`Error deleting Vyapari with ID ${id}:`, error);
    throw new Error(`Failed to delete Vyapari with ID ${id}.`);
  }
};


// --- Product Operations ---
const productsCollection = collection(db, "products");

export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCollection, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...(processFirestoreDataForRead(data) as Omit<Product, "id">),
      } as Product;
    });
  } catch (error) {
    console.error("Error fetching Products:", error);
    throw new Error("Failed to fetch Products.");
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(processFirestoreDataForRead(data) as Omit<Product, "id">),
      } as Product;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Product with ID ${id}:`, error);
    throw new Error(`Failed to fetch Product with ID ${id}.`);
  }
};


export const addProduct = async (
  productData: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> => { // Changed return type to Promise<Product>
  try {
    const docRef = await addDoc(productsCollection, {
      ...productData,
      active: productData.active ?? true, // Ensure 'active' is set, default to true
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const newProduct = await getProductById(docRef.id); // Fetch the newly added Product
    if (!newProduct) throw new Error("Failed to retrieve new Product after adding.");
    return newProduct;
  } catch (error) {
    console.error("Error adding Product:", error);
    throw new Error("Failed to add Product.");
  }
};

export const updateProduct = async (
  id: string,
  productData: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating Product with ID ${id}:`, error);
    throw new Error(`Failed to update Product with ID ${id}.`);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (error) {
    console.error(`Error deleting Product with ID ${id}:`, error);
    throw new Error(`Failed to delete Product with ID ${id}.`);
  }
};


// --- System Settings Operations ---
// Note: Collection name 'systemSettings' and document ID 'mandiDefaults' are fixed.
const systemSettingsCollection = collection(db, "systemSettings");

export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  try {
    const docRef = doc(systemSettingsCollection, "mandiDefaults");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id, // Will be "mandiDefaults"
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
};

export const updateSystemSettings = async (
  settingsData: Partial<Omit<SystemSettings, "id" | "updatedAt">> // id is fixed, updatedAt is handled
): Promise<void> => {
  try {
    const docRef = doc(systemSettingsCollection, "mandiDefaults");
    await updateDoc(docRef, {
      ...settingsData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating System Settings:", error);
    throw new Error("Failed to update System Settings.");
  }
};

// --- Transaction Operations ---
export const transactionsCollection = collection(db, "transactions");

// Interface for transaction filters
export interface TransactionFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  kisanRef?: string | null;
  vyapariRef?: string | null;
  productRef?: string | null; // This will filter by productRef within the productRefs array
}

export const addTransaction = async (
  transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "productRefs"> // Exclude productRefs as we'll generate it
): Promise<Transaction> => {
  const batch = writeBatch(db);
  const transactionRef = doc(transactionsCollection);

  // Generate productRefs array from items for denormalization
  const productRefs = Array.from(new Set(transactionData.items.map(item => item.productRef)));

  // Prepare transaction data
  const newTransactionData = {
    ...transactionData,
    transactionDate: Timestamp.fromDate(transactionData.transactionDate as Date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    id: transactionRef.id,
    productRefs: productRefs, // Add the denormalized productRefs
  };
  batch.set(transactionRef, newTransactionData);

  // --- Update Kisan's bakaya and cropsSold ---
  const kisanRef = doc(db, 'kisans', transactionData.kisanRef);
  const kisanSnap = await getDoc(kisanRef);
  if (kisanSnap.exists()) {
    const currentKisanData = processFirestoreDataForRead(kisanSnap.data()) as Kisan;
    const currentKisanBakaya = currentKisanData.bakaya || 0;
    const currentKisanCropsSold = new Set(currentKisanData.cropsSold || []);

    // Update bakaya
    const newKisanBakaya = currentKisanBakaya - transactionData.netAmountKisan + transactionData.amountPaidKisan;

    // Update cropsSold
    transactionData.items.forEach(item => {
      currentKisanCropsSold.add(item.productName);
    });
    const updatedKisanCropsSold = Array.from(currentKisanCropsSold);

    batch.update(kisanRef, {
      bakaya: newKisanBakaya,
      cropsSold: updatedKisanCropsSold, // Update cropsSold
      updatedAt: serverTimestamp()
    });
  } else {
    console.warn(`Kisan with ID ${transactionData.kisanRef} not found for bakaya and cropsSold update.`);
  }

  // --- Update Vyapari's bakaya and cropsBought ---
  const vyapariRef = doc(db, 'vyaparis', transactionData.vyapariRef);
  const vyapariSnap = await getDoc(vyapariRef);
  if (vyapariSnap.exists()) {
    const currentVyapariData = processFirestoreDataForRead(vyapariSnap.data()) as Vyapari;
    const currentVyapariBakaya = currentVyapariData.bakaya || 0;
    const currentVyapariCropsBought = new Set(currentVyapariData.cropsBought || []);

    // Update bakaya
    const newVyapariBakaya = currentVyapariBakaya + transactionData.netAmountVyapari - transactionData.amountPaidVyapari;

    // Update cropsBought
    transactionData.items.forEach(item => {
      currentVyapariCropsBought.add(item.productName);
    });
    const updatedVyapariCropsBought = Array.from(currentVyapariCropsBought);

    batch.update(vyapariRef, {
      bakaya: newVyapariBakaya,
      cropsBought: updatedVyapariCropsBought, // Update cropsBought
      updatedAt: serverTimestamp()
    });
  } else {
    console.warn(`Vyapari with ID ${transactionData.vyapariRef} not found for bakaya and cropsBought update.`);
  }

  try {
    await batch.commit();
    const newTransaction = await getTransactionById(transactionRef.id);
    if (!newTransaction) throw new Error("Failed to retrieve new Transaction after adding.");
    return newTransaction;
  } catch (error) {
    console.error("Error committing transaction batch:", error);
    throw new Error("Failed to add Transaction and update balances.");
  }
};

export const getTransactions = async (filters: TransactionFilters = {}): Promise<Transaction[]> => {
  try {
    let q: any = query(transactionsCollection); // Start with the base collection query

    // Apply filters
    if (filters.startDate) {
      q = query(q, where("transactionDate", ">=", Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      // To include the entire end day, set the timestamp to the end of the day
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
      // Use array-contains to query for a product ID within the productRefs array
      q = query(q, where("productRefs", "array-contains", filters.productRef));
    }

    // Always order for consistent results, especially with range queries
    // Firestore requires orderBy fields to be part of the query's where clauses
    // or to be the first orderBy field. For complex filters, composite indexes are key.
    q = query(q, orderBy("transactionDate", "desc"), orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);

    // IMPORTANT: For any combination of `where` clauses (especially with `orderBy`),
    // you might need to create composite indexes in your Firebase Console.
    // Firestore will typically provide a link in the error message if an index is missing.
    console.log("Firestore Query Constructed:", q); // Log the query for debugging

    return querySnapshot.docs.map((transactionDoc) => {
      const data = transactionDoc.data();
      // Process raw data from Firestore to convert Timestamps to Dates
      const processedData = processFirestoreDataForRead(data);

      return {
        id: transactionDoc.id,
        ...processedData,
        kisanName: processedData.kisanName || "Unknown Kisan",
        vyapariName: processedData.vyapariName || "Unknown Vyapari",
      } as Transaction;
    });
  } catch (error) {
    console.error("Error fetching Transactions with filters:", error);
    throw new Error("Failed to fetch Transactions.");
  }
};

export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const transactionDocRef = doc(transactionsCollection, transactionId);
    const docSnap = await getDoc(transactionDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const processedData = processFirestoreDataForRead(data);

      // Assuming kisanName and vyapariName are denormalized on the transaction document itself
      return {
        id: docSnap.id,
        ...processedData,
        kisanName: processedData.kisanName || "Unknown Kisan", // Provide a fallback
        vyapariName: processedData.vyapariName || "Unknown Vyapari", // Provide a fallback
      } as Transaction;
    } else {
      console.log(`No transaction found with ID: ${transactionId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching Transaction with ID ${transactionId}:`, error);
    throw new Error(`Failed to fetch Transaction with ID ${transactionId}.`);
  }
};

export const updateTransaction = async (
  id: string,
  transactionData: Partial<Omit<Transaction, "id" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, "transactions", id);
    const updatePayload: any = {
      ...transactionData,
      updatedAt: serverTimestamp(),
    };

    // If transactionDate is being updated and it's a Date object, convert it to Timestamp
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
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "transactions", id));
  } catch (error) {
    console.error(`Error deleting Transaction with ID ${id}:`, error);
    throw new Error(`Failed to delete Transaction with ID ${id}.`);
  }
};

// --- Payment Operations (New) ---
const paymentsCollection = collection(db, "payments");

export const addPayment = async (
  paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Payment> => {
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
    const currentBakaya = entitySnap.data().bakaya || 0;
    let newBakaya = currentBakaya;

    // Let's assume 'bakaya' is 'what the entity owes Mandi'.
    // If bakaya is positive, entity owes Mandi.
    // If bakaya is negative, Mandi owes entity.

    if (paymentData.entityType === 'kisan') {
      // Payment from Mandi to Kisan. This reduces Mandi's debt (makes bakaya less negative or more positive).
      // So, we add the amount to the current bakaya.
      newBakaya = currentBakaya + paymentData.amount;
    } else if (paymentData.entityType === 'vyapari') {
      // Payment from Vyapari to Mandi. This reduces Vyapari's debt (makes bakaya less positive or or more negative).
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
