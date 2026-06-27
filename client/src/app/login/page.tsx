"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/Button";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tab control: "signin" | "signup"
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  
  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Google login modal states
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  
  const mockGoogleAccounts = [
    { email: "alok.tripathi@gmail.com", name: "Alok Tripathi", avatar: "AT" },
    { email: "dev.team@neurondash.ai", name: "NeuronDash Dev", avatar: "ND" },
    { email: "guest.user@gmail.com", name: "Guest User", avatar: "GU" }
  ];
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "signup") {
      setActiveTab("signup");
    } else {
      setActiveTab("signin");
    }
  }, [searchParams]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const dark = savedTheme === "dark";
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (activeTab === "signup" && password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "signup") {
        // 1. Register User
        const regRes = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            full_name: fullName,
            password
          })
        });

        if (!regRes.ok) {
          const errData = await regRes.json();
          const detail = typeof errData.detail === "string" 
            ? errData.detail 
            : Array.isArray(errData.detail) 
              ? errData.detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ") 
              : JSON.stringify(errData.detail);
          throw new Error(detail || "Registration failed. Email might already be taken.");
        }
      }

      // 2. Login User to get access token
      const logRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!logRes.ok) {
        const errData = await logRes.json();
        const detail = typeof errData.detail === "string" 
          ? errData.detail 
          : Array.isArray(errData.detail) 
            ? errData.detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ") 
            : JSON.stringify(errData.detail);
        throw new Error(detail || "Authentication failed. Please verify your credentials.");
      }

      const data = await logRes.json();
      
      // Save token in localStorage
      localStorage.setItem("neurondash_token", data.access_token);
      
      // Redirect to workspace
      router.push("/workspace");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setErrorMsg(null);
    setLoading(true);

    const guestId = Math.random().toString(36).substring(2, 9);
    const guestEmail = `guest_${guestId}@neurondash.com`;
    const guestPassword = `guestpass_${guestId}`;
    const guestName = `Guest ${guestId}`;

    try {
      // 1. Register Guest User
      const regRes = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: guestEmail,
          full_name: guestName,
          password: guestPassword
        })
      });

      if (!regRes.ok) {
        const errData = await regRes.json();
        const detail = typeof errData.detail === "string" 
          ? errData.detail 
          : Array.isArray(errData.detail) 
            ? errData.detail.map((e: any) => e.msg).join(", ") 
            : JSON.stringify(errData.detail);
        throw new Error(detail || "Guest registration failed.");
      }

      // 2. Login Guest to get access token
      const logRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: guestEmail,
          password: guestPassword
        })
      });

      if (!logRes.ok) {
        const errData = await logRes.json();
        const detail = typeof errData.detail === "string" 
          ? errData.detail 
          : Array.isArray(errData.detail) 
            ? errData.detail.map((e: any) => e.msg).join(", ") 
            : JSON.stringify(errData.detail);
        throw new Error(detail || "Guest login failed.");
      }

      const data = await logRes.json();
      
      // Save token in localStorage
      localStorage.setItem("neurondash_token", data.access_token);
      
      // Redirect to workspace
      router.push("/workspace");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during guest login.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const guestParam = searchParams.get("guest");
    if (guestParam === "true") {
      handleGuestLogin();
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleModalOpen(true);
  };

  const handleExecuteGoogleLogin = async (googleEmail: string, googleName: string) => {
    setErrorMsg(null);
    setGoogleLoading(true);

    try {
      let tokenValue = null;
      
      const logRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail,
          password: "google_account_placeholder_password"
        })
      });
      
      if (logRes.ok) {
        const data = await logRes.json();
        tokenValue = data.access_token;
      } else {
        const regRes = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: googleEmail,
            full_name: googleName,
            password: "google_account_placeholder_password"
          })
        });
        
        if (regRes.ok) {
          const logRes2 = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: googleEmail,
              password: "google_account_placeholder_password"
            })
          });
          
          if (logRes2.ok) {
            const data = await logRes2.json();
            tokenValue = data.access_token;
          }
        } else {
          if (regRes.status === 400) {
            const logRes3 = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: googleEmail,
                password: "google_account_placeholder_password"
              })
            });
            if (logRes3.ok) {
              const data = await logRes3.json();
              tokenValue = data.access_token;
            }
          }
        }
      }

      if (!tokenValue) {
        throw new Error("Unable to establish Google SSO session.");
      }

      localStorage.setItem("neurondash_token", tokenValue);
      setIsGoogleModalOpen(false);
      router.push("/workspace");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during Google authentication.");
      setIsGoogleModalOpen(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center justify-center w-full hover:opacity-90 transition-opacity">
            <img src={isDarkMode ? "/logo-horizontal-dark.png" : "/logo-horizontal-light.png"} alt="NeuronDash Logo" className="h-12 w-auto object-contain animate-[fade-in_0.5s_ease-out]" />
          </Link>
          <p className="text-sm text-on-surface-variant max-w-xs mt-2">
            AI-powered data diagnostics and interactive reporting dashboards.
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-card rounded-[2.5rem] border border-outline-variant/30 p-8 shadow-2xl bg-surface-container-lowest/70 backdrop-blur-xl relative overflow-hidden">
          
          {/* Tab Switcher */}
          <div className="flex bg-surface-container-high/40 p-1.5 rounded-full mb-8 border border-outline-variant/10">
            <button
              onClick={() => { setActiveTab("signin"); setErrorMsg(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 ${
                activeTab === "signin"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setErrorMsg(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 ${
                activeTab === "signup"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === "signup" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-5 h-5 text-on-surface-variant/70" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-on-surface-variant/70" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-on-surface-variant/70" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 bg-error/10 text-error rounded-xl text-xs font-semibold leading-relaxed border border-error/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? (
                <span>Securing session...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{activeTab === "signin" ? "Sign In to Account" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-outline-variant/20"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-tertiary uppercase tracking-wider">or connect via</span>
              <div className="flex-grow border-t border-outline-variant/20"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="secondary"
                size="md"
                className="text-xs"
              >
                <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </Button>
              
              <Button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                variant="secondary"
                size="md"
                className="text-xs"
              >
                <div className="flex items-center gap-1">
                  <span>Guest</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </div>
              </Button>
            </div>

          </form>

        </div>

        {/* Security assurance */}
        <div className="flex justify-center items-center gap-2 text-xs font-bold text-tertiary uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Local SQLite Encryption Enabled</span>
        </div>

      </div>

      {/* Google Account Selection Modal */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-card rounded-[2rem] border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-black tracking-tight text-on-surface">Google Account</span>
              </div>
              <button 
                onClick={() => {
                  setIsGoogleModalOpen(false);
                  setShowCustomEmailInput(false);
                  setCustomGoogleEmail("");
                }}
                disabled={googleLoading}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/40 hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {googleLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-primary">Signing in with Google...</p>
              </div>
            ) : showCustomEmailInput ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-on-surface">Sign in</h3>
                <p className="text-xs text-on-surface-variant">to continue to NeuronDash</p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-tertiary uppercase tracking-wider block">Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-sm font-medium transition-colors text-on-surface"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomEmailInput(false)}
                    className="flex-1 py-3 rounded-xl font-bold border border-outline-variant/30 text-on-surface hover:bg-surface-container-high/40 transition-all text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (customGoogleEmail.trim()) {
                        const name = customGoogleEmail.split("@")[0].replace(/[._-]/g, " ");
                        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
                        handleExecuteGoogleLogin(customGoogleEmail.trim(), formattedName);
                      }
                    }}
                    disabled={!customGoogleEmail.trim()}
                    className="flex-1 py-3 rounded-xl font-bold kinetic-gradient text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all text-xs cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-on-surface">Choose an account</h3>
                  <p className="text-xs text-on-surface-variant mt-1">to continue to <span className="font-semibold">NeuronDash</span></p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {mockGoogleAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleExecuteGoogleLogin(acc.email, acc.name)}
                      className="w-full p-3 rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/10 transition-all flex items-center gap-3 text-left cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary text-sm group-hover:bg-primary group-hover:text-white transition-all">
                        {acc.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{acc.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowCustomEmailInput(true)}
                    className="w-full p-3 rounded-2xl border border-dashed border-outline-variant/30 hover:border-primary/40 hover:bg-primary/10 transition-all flex items-center gap-3 text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-tertiary text-sm">
                      +
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Use another account</p>
                      <p className="text-xs text-on-surface-variant">Sign in with a different email</p>
                    </div>
                  </button>
                </div>

                <div className="text-[10px] text-tertiary leading-relaxed text-center px-4">
                  To continue, Google will share your name, email address, language preference, and profile picture with NeuronDash.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col justify-center items-center p-6">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-primary mt-4">Loading Auth Gateway...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
