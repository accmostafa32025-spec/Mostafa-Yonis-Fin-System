import {
  db,
  auth,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  FirebaseUser,
  testConnection,
} from './firebase';
import { Member, MonthlySavingsRecord, JournalEntry, AuditLog } from '../types/accounting';

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  roleTitleAr: string;
  lastLogin: string;
}

// Save or sync authenticated user profile
export async function syncUserProfileToFirestore(user: FirebaseUser): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const existingSnap = await getDoc(userRef).catch(() => null);
  
  let profile: UserProfileData;
  if (existingSnap && existingSnap.exists()) {
    const data = existingSnap.data() as UserProfileData;
    profile = {
      ...data,
      displayName: user.displayName || data.displayName || 'مستخدم النظام',
      email: user.email || data.email,
      photoURL: user.photoURL || data.photoURL,
      lastLogin: new Date().toISOString(),
    };
  } else {
    profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'مستخدم النظام',
      photoURL: user.photoURL || '',
      role: 'cfo', // First user / admin privilege
      roleTitleAr: 'المدير المالي والرقابي المعتمد',
      lastLogin: new Date().toISOString(),
    };
  }

  try {
    await setDoc(userRef, profile, { merge: true });
  } catch (err) {
    console.warn('Failed to persist user profile to Firestore (using local):', err);
  }

  return profile;
}

// Save Monthly Savings Records batch to Firestore
export async function saveSavingsUploadToFirestore(records: MonthlySavingsRecord[]): Promise<boolean> {
  try {
    for (const record of records) {
      const docRef = doc(db, 'savings_uploads', record.id || `sav-${record.jobNumber}`);
      await setDoc(docRef, {
        ...record,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    return true;
  } catch (error) {
    console.warn('Failed to save savings uploads to Firestore:', error);
    return false;
  }
}

// Fetch Savings Records from Firestore
export async function fetchSavingsFromFirestore(): Promise<MonthlySavingsRecord[] | null> {
  try {
    const querySnapshot = await getDocs(collection(db, 'savings_uploads'));
    if (querySnapshot.empty) return null;
    const records: MonthlySavingsRecord[] = [];
    querySnapshot.forEach((d) => {
      records.push(d.data() as MonthlySavingsRecord);
    });
    return records;
  } catch (error) {
    console.warn('Could not fetch savings from Firestore:', error);
    return null;
  }
}

// Save Members to Firestore
export async function saveMembersToFirestore(members: Member[]): Promise<boolean> {
  try {
    for (const mem of members) {
      const docRef = doc(db, 'members', mem.id);
      await setDoc(docRef, mem, { merge: true });
    }
    return true;
  } catch (error) {
    console.warn('Failed to save members to Firestore:', error);
    return false;
  }
}

// Log audit action to Firestore
export async function logAuditToFirestore(auditLog: AuditLog): Promise<void> {
  try {
    const docRef = doc(db, 'audit_logs', auditLog.id);
    await setDoc(docRef, auditLog);
  } catch (err) {
    // Non-blocking for offline
    console.warn('Audit log write to Firestore skipped/failed:', err);
  }
}

// Re-export testConnection
export { testConnection };

