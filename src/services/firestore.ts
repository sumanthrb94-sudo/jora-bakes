import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  QueryConstraint
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper functions for common operations
const DEFAULT_TIMEOUT = 10000; // 10 seconds (reduced from 30)

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = DEFAULT_TIMEOUT): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

export const getDocuments = async <T>(collectionPath: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> => {
  try {
    const q = query(collection(db, collectionPath), ...queryConstraints);
    const querySnapshot = await withTimeout(getDocs(q));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error getting documents from ${collectionPath}:`, error);
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    return [];
  }
};

export const getDocument = async <T>(collectionPath: string, docId: string): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionPath, docId);
    const docSnap = await withTimeout(getDoc(docRef));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document ${collectionPath}/${docId}:`, error);
    handleFirestoreError(error, OperationType.GET, `${collectionPath}/${docId}`);
    return null;
  }
};

export const createDocument = async <T extends object>(collectionPath: string, data: T, docId?: string): Promise<string> => {
  try {
    if (docId) {
      await withTimeout(setDoc(doc(db, collectionPath, docId), data));
      return docId;
    } else {
      const docRef = await withTimeout(addDoc(collection(db, collectionPath), data));
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error creating document in ${collectionPath}:`, error);
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    return '';
  }
};

export const updateDocument = async <T extends object>(collectionPath: string, docId: string, data: Partial<T>): Promise<void> => {
  try {
    const docRef = doc(db, collectionPath, docId);
    await withTimeout(updateDoc(docRef, data as any));
  } catch (error) {
    console.error(`Error updating document ${collectionPath}/${docId}:`, error);
    handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${docId}`);
  }
};

export const subscribeToCollection = <T>(
  collectionPath: string, 
  callback: (data: T[]) => void,
  errorCallback?: (error: any) => void,
  ...queryConstraints: QueryConstraint[]
) => {
  const q = query(collection(db, collectionPath), ...queryConstraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
    callback(data);
  }, (error) => {
    console.error(`Subscription error for ${collectionPath}:`, error);
    if (errorCallback) {
      errorCallback(error);
    } else {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  });
};
