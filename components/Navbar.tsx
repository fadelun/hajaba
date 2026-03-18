'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { LogIn, LogOut, User as UserIcon, X, Mail, Lock, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

type AuthTab = 'login' | 'register';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };

    if (showAuthModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [showAuthModal]);

  const closeModal = () => {
    setShowAuthModal(false);
    setAuthError(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const openModal = (tab: AuthTab = 'login') => {
    setAuthTab(tab);
    setAuthError(null);
    setShowAuthModal(true);
  };

  const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Silakan login.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/weak-password':
        return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
      case 'auth/user-not-found':
        return 'Akun tidak ditemukan. Silakan register terlebih dahulu.';
      case 'auth/wrong-password':
        return 'Password salah. Coba lagi.';
      case 'auth/invalid-credential':
        return 'Email atau password salah.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan. Coba lagi nanti.';
      case 'auth/popup-closed-by-user':
        return 'Login Google dibatalkan.';
      default:
        return 'Terjadi kesalahan. Silakan coba lagi.';
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      closeModal();
    } catch (error: any) {
      setAuthError(getFirebaseErrorMessage(error.code));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (!name.trim()) {
      setAuthError('Nama tidak boleh kosong.');
      setAuthLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name.trim() });

      // Save to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name.trim(),
        photoURL: null,
        createdAt: serverTimestamp(),
      });

      closeModal();
    } catch (error: any) {
      setAuthError(getFirebaseErrorMessage(error.code));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      closeModal();
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(getFirebaseErrorMessage(error.code));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl italic">H</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">hajaba</h1>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-black/5 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium">{user.displayName || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-[10px] uppercase tracking-wider font-bold opacity-50 hover:opacity-100 transition-opacity"
                >
                  Logout
                </button>
              </div>
              {user.photoURL ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/10">
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Mobile logout */}
              <button
                onClick={handleLogout}
                className="sm:hidden w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openModal('login')}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/80 transition-colors"
            >
              <LogIn size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 pb-0">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {authTab === 'login' ? 'Selamat Datang' : 'Buat Akun'}
                  </h2>
                  <p className="text-sm text-black/40 mt-1">
                    {authTab === 'login'
                      ? 'Masuk untuk menyimpan riwayat edit kamu'
                      : 'Daftar untuk mulai menggunakan Hajaba'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex mx-6 mt-6 bg-black/5 rounded-xl p-1">
                <button
                  onClick={() => { setAuthTab('login'); setAuthError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${authTab === 'login'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-black/40 hover:text-black/60'
                    }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthTab('register'); setAuthError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${authTab === 'register'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-black/40 hover:text-black/60'
                    }`}
                >
                  Register
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4">
                {/* Error Message */}
                <AnimatePresence>
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      <p className="text-sm font-medium">{authError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={authTab === 'login' ? handleEmailLogin : handleEmailRegister}>
                  <div className="space-y-3">
                    {/* Name (Register only) */}
                    {authTab === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1.5 block">Nama</label>
                        <div className="relative">
                          <UserPlus size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nama lengkap"
                            className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-black/25"
                            required
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Email */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1.5 block">Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-black/25"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1.5 block">Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={authTab === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                          className="w-full pl-10 pr-12 py-3 bg-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-all placeholder:text-black/25"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all mt-2 ${authLoading
                          ? 'bg-black/20 text-black/40 cursor-not-allowed'
                          : 'bg-black text-white hover:bg-black/90 active:scale-[0.98]'
                        }`}
                    >
                      {authLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          Memproses...
                        </span>
                      ) : authTab === 'login' ? (
                        'Masuk'
                      ) : (
                        'Daftar'
                      )}
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-black/10" />
                  <span className="text-black/30 text-xs font-medium">atau</span>
                  <div className="flex-1 h-px bg-black/10" />
                </div>

                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl font-medium text-sm border border-black/10 hover:bg-black/5 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Lanjutkan dengan Google</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
