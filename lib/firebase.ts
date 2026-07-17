import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  type Firestore,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth';
import type { DebateSession } from '@/lib/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  const apps = getApps();
  return apps.length ? apps[0] : initializeApp(firebaseConfig);
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

let authReady: Promise<string> | null = null;

// 個人利用前提の簡易認証（匿名認証）。UIDが確定するまで待つ。
export function ensureAnonymousAuth(): Promise<string> {
  if (!authReady) {
    const auth = getFirebaseAuth();
    authReady = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            unsubscribe();
            resolve(user.uid);
          }
        },
        reject,
      );
      signInAnonymously(auth).catch(reject);
    });
  }
  return authReady;
}

const DEBATES_COLLECTION = 'debates';

export async function saveDebateSession(session: DebateSession): Promise<void> {
  const uid = await ensureAnonymousAuth();
  // ownerUid はFirestoreセキュリティルールでの本人判定用に付与する（DebateSession型には含めない）。
  await setDoc(doc(getDb(), DEBATES_COLLECTION, session.id), { ...session, ownerUid: uid });
}

export async function listDebateSessions(max = 30): Promise<DebateSession[]> {
  const uid = await ensureAnonymousAuth();
  const q = query(
    collection(getDb(), DEBATES_COLLECTION),
    where('ownerUid', '==', uid),
    orderBy('createdAt', 'desc'),
    fsLimit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DebateSession);
}

export async function getDebateSession(id: string): Promise<DebateSession | null> {
  await ensureAnonymousAuth();
  const snap = await getDoc(doc(getDb(), DEBATES_COLLECTION, id));
  return snap.exists() ? (snap.data() as DebateSession) : null;
}
