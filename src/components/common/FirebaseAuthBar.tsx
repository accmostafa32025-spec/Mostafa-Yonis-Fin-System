import React, { useState, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  logOutUser,
  onAuthStateChanged,
  FirebaseUser,
  testConnection,
} from '../../services/firebase';
import { syncUserProfileToFirestore, UserProfileData } from '../../services/firestoreDataService';
import { ShieldCheck, LogIn, LogOut, Database, UserCheck, CloudCheck, AlertTriangle } from 'lucide-react';

interface FirebaseAuthBarProps {
  onUserChanged?: (user: FirebaseUser | null, profile: UserProfileData | null) => void;
}

export const FirebaseAuthBar: React.FC<FirebaseAuthBarProps> = ({ onUserChanged }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Test initial connection to Firestore per skill constraint
    testConnection().then((ok) => setIsFirestoreConnected(ok));

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(false);
      setCurrentUser(user);
      if (user) {
        setAuthError(null);
        try {
          const profile = await syncUserProfileToFirestore(user);
          setUserProfile(profile);
          if (onUserChanged) onUserChanged(user, profile);
        } catch (err) {
          console.error('Error syncing user profile:', err);
        }
      } else {
        setUserProfile(null);
        if (onUserChanged) onUserChanged(null, null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        const profile = await syncUserProfileToFirestore(user);
        setUserProfile(profile);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('تعذر تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutUser();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Firestore Cloud Sync Status Badge */}
      <div
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-bold text-slate-300"
        title={isFirestoreConnected ? 'سحابة Firestore متصلة وجاهزة للمزامنة الحية' : 'جاري التحقق من اتصال قاعدة البيانات'}
      >
        <span className={`w-2 h-2 rounded-full ${isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        <Database className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px]">قاعدة بيانات Firestore</span>
      </div>

      {isLoading ? (
        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 animate-pulse flex items-center gap-1.5 font-bold">
          <span>جاري التحقق...</span>
        </div>
      ) : currentUser ? (
        <div className="flex items-center gap-2 bg-[#12162a] border border-[#2b325c] rounded-xl px-2 py-1 shadow-md">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="w-7 h-7 rounded-lg border border-[#39e3d7]/40 object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#3632c7] text-white flex items-center justify-center font-bold text-xs">
              {(currentUser.displayName || 'عضو').charAt(0)}
            </div>
          )}

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-black text-white leading-tight">
              {currentUser.displayName || currentUser.email?.split('@')[0]}
            </span>
            <span className="text-[10px] text-[#39e3d7] font-semibold">
              {userProfile?.roleTitleAr || 'مستخدم معتمد بالجهاز'}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-white to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-900 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            title="تسجيل الدخول الآمن بحساب Google وحفظ البيانات في Firestore"
          >
            {/* Google SVG Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>دخول Google</span>
          </button>
        </div>
      )}

      {authError && (
        <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
          {authError}
        </span>
      )}
    </div>
  );
};
