// src/lib/firebase/firestoreService.ts

import { db } from "./clientApp"; // Import the initialized Firestore instance
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
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

import { Kisan, Vyapari, Product, SystemSettings, Transaction } from "@/types";

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
  kisanData: Omit<Kisan, "id" | "createdAt" | "updatedAt" | "lastTransactionDate"> // Exclude these as they're set by serverTimestamp or later
): Promise<string> => {
  try {
    const docRef = await addDoc(kisansCollection, {
      ...kisanData,
      bakaya: kisanData.bakaya || 0, // Ensure bakaya is initialized
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
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
  vyapariData: Omit<Vyapari, "id" | "createdAt" | "updatedAt" | "lastTransactionDate">
): Promise<string> => {
  try {
    const docRef = await addDoc(vyaparisCollection, {
      ...vyapariData,
      bakaya: vyapariData.bakaya || 0, // Ensure bakaya is initialized
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
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
): Promise<string> => {
  try {
    const docRef = await addDoc(productsCollection, {
      ...productData,
      active: productData.active ?? true, // Ensure 'active' is set, default to true
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
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
const transactionsCollection = collection(db, "transactions");

export const addTransaction = async (
  // Ensure transactionDate is a Date object for conversion to Timestamp
  transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(transactionsCollection, {
      ...transactionData,
      // Convert Date object to Firestore Timestamp explicitly for consistency
      transactionDate: Timestamp.fromDate(transactionData.transactionDate as Date),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding Transaction:", error);
    throw new Error("Failed to add Transaction.");
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const q = query(
      transactionsCollection,
      orderBy("transactionDate", "desc"),
      orderBy("createdAt", "desc") // Secondary order to handle same date transactions
    );
    const querySnapshot = await getDocs(q);

    const transactionsWithDetails: Transaction[] = [];

    // Fetch Kisan and Vyapari names for each transaction
    // Note: This approach performs N+1 reads if names are not denormalized on the transaction itself.
    // If kisanName/vyapariName are denormalized fields on the Transaction document in Firestore,
    // you can remove the nested getDoc calls for better read performance.
    for (const transactionDoc of querySnapshot.docs) {
      const data = transactionDoc.data();
      const transactionId = transactionDoc.id;

      // Process raw data from Firestore to convert Timestamps to Dates
      const processedData = processFirestoreDataForRead(data);

      let kisanName = "Unknown Kisan";
      if (processedData.kisanRef) {
        const kisanDocRef = doc(db, "kisans", processedData.kisanRef);
        const kisanDocSnap = await getDoc(kisanDocRef);
        if (kisanDocSnap.exists()) {
          kisanName = (processFirestoreDataForRead(kisanDocSnap.data()) as Kisan).name;
        }
      }

      let vyapariName = "Unknown Vyapari";
      if (processedData.vyapariRef) {
        const vyapariDocRef = doc(db, "vyaparis", processedData.vyapariRef);
        const vyapariDocSnap = await getDoc(vyapariDocRef);
        if (vyapariDocSnap.exists()) {
          vyapariName = (processFirestoreDataForRead(vyapariDocSnap.data()) as Vyapari).name;
        }
      }

      transactionsWithDetails.push({
        id: transactionId,
        ...processedData, // Spread the processed data (already has transactionDate as Date)
        kisanName: kisanName, // Add denormalized names (or fetch if not present in transaction doc)
        vyapariName: vyapariName, // Add denormalized names (or fetch if not present in transaction doc)
      } as Transaction);
    }

    return transactionsWithDetails;
  } catch (error) {
    console.error("Error fetching Transactions:", error);
    throw new Error("Failed to fetch Transactions.");
  }
};

export const getTransactionById = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const transactionDocRef = doc(transactionsCollection, transactionId);
    const docSnap = await getDoc(transactionDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Process raw data first, casting it to the core transaction structure without names
      const transactionCore = processFirestoreDataForRead(data) as Omit<Transaction, 'id' | 'kisanName' | 'vyapariName'>;

      let kisanName = "Unknown Kisan";
      if (transactionCore.kisanRef) {
        const kisanDocRef = doc(db, "kisans", transactionCore.kisanRef);
        const kisanDocSnap = await getDoc(kisanDocRef);
        if (kisanDocSnap.exists()) {
          kisanName = (processFirestoreDataForRead(kisanDocSnap.data()) as Kisan).name;
        }
      }

      let vyapariName = "Unknown Vyapari";
      if (transactionCore.vyapariRef) {
        const vyapariDocRef = doc(db, "vyaparis", transactionCore.vyapariRef);
        const vyapariDocSnap = await getDoc(vyapariDocRef);
        if (vyapariDocSnap.exists()) {
          vyapariName = (processFirestoreDataForRead(vyapariDocSnap.data()) as Vyapari).name;
        }
      }

      return {
        id: docSnap.id,
        ...transactionCore, // Spread the core data (already has transactionDate as Date)
        kisanName: kisanName, // Add denormalized names
        vyapariName: vyapariName, // Add denormalized names
      } as Transaction; // Finally, assert to the full Transaction type

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