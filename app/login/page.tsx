"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { PageTransition } from "@/components/ui/PageTransition";
import { audio } from "@/lib/audio";
import { useERStore } from "@/lib/erStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { setSyncEnabled, setPlayerName } = useERStore();

  // Handle returning from Magic Link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let savedEmail = window.localStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        savedEmail = window.prompt('Please provide your email for confirmation');
      }
      
      if (savedEmail) {
        setLoading(true);
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            setSyncEnabled(true);
            if (result.user?.email) {
              setPlayerName(result.user.email.split('@')[0]);
            }
            router.push("/hub");
          })
          .catch((err) => {
            setError(err.message);
            setLoading(false);
          });
      }
    }
  }, [router, setSyncEnabled]);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    audio.playClick();
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setSyncEnabled(true);
      if (result.user?.displayName) {
        setPlayerName(result.user.displayName);
      } else if (result.user?.email) {
        setPlayerName(result.user.email.split('@')[0]);
      }
      router.push("/hub");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setError("");
    setLoading(true);
    audio.playClick();
    
    try {
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      setSyncEnabled(true);
      if (result.user?.displayName) {
        setPlayerName(result.user.displayName);
      } else if (result.user?.email) {
        setPlayerName(result.user.email.split('@')[0]);
      }
      router.push("/hub");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setMessage("");
    setLoading(true);
    audio.playClick();
    
    const actionCodeSettings = {
      // URL must be whitelisted in Firebase Console -> Auth -> Settings -> Authorized Domains
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage(`A magic link has been sent to ${email}. Please check your inbox and click the link to log in.`);
      setEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const skipLogin = () => {
    audio.playClick();
    setSyncEnabled(false);
    router.push("/hub");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4 font-pixel relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm pointer-events-none bg-[url(/assets/er_bg.jpg)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

        <PixelPanel variant="dark" className="w-full max-w-md relative z-10 border-4 border-[#30363d] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl text-pixel-gold font-bold drop-shadow-md mb-2">CODE RAMA</h1>
            <p className="text-xs text-gray-400">Department of Emergency Medicine</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 text-xs p-3 rounded mb-4 break-words">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 text-xs p-3 rounded mb-4 break-words">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <PixelButton
              onClick={handleGoogle}
              variant="secondary"
              className="w-full py-3 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? "..." : "Sign in with Google"}
            </PixelButton>

            <PixelButton
              onClick={handleApple}
              variant="secondary"
              className="w-full py-3 flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-900 border-2 border-gray-700"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.82 1.5-.04 2.76.62 3.5 1.76-3.04 1.77-2.56 5.58.53 6.84-.71 1.93-1.8 3.54-2.69 4.39M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"/>
              </svg>
              {loading ? "..." : "Sign in with Apple"}
            </PixelButton>

            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-xs text-gray-500 uppercase">OR</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <form onSubmit={handleMagicLink} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black border-2 border-gray-600 text-white p-3 rounded font-sans text-sm focus:border-pixel-primary focus:outline-none"
                placeholder="Enter email for Magic Link"
                required
              />
              <PixelButton
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm shadow-lg"
                disabled={loading}
              >
                {loading ? "SENDING..." : "Send Magic Link"}
              </PixelButton>
            </form>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <button 
              onClick={skipLogin}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
              type="button"
            >
              Play Offline (No Cloud Save)
            </button>
          </div>
        </PixelPanel>
      </div>
    </PageTransition>
  );
}
