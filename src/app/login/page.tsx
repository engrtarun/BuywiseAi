"use client";

import React, { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/logo";
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Lock, 
  Mail, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2,
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { useGuestAccess } from "@/hooks/useGuestAccess";

export default function LoginPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const router = useRouter();
  const supabase = createClient();
  const { enterGuestMode, resetGuestAccess } = useGuestAccess();

  /** Skip login → enter as guest */
  const handleGuestSkip = () => {
    enterGuestMode();
    router.push("/");
  };

  // Loading and Error States
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [viewState, setViewState] = useState<"login" | "reset_password" | "reset_success" | "otp">("login");

  // OTP Verification Specific state
  const [otpCodes, setOtpCodes] = useState<string[]>(Array(8).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Set document title
  useEffect(() => {
    document.title = "BuyWise AI - Sign In";
  }, []);

  // Cooldown timer for resending OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const focusOtpInput = (index: number) => {
    if (otpRefs.current[index]) {
      otpRefs.current[index]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (viewState === "login") {
        if (email.trim() && password) handleLogin();
      } else if (viewState === "reset_password") {
        if (email.trim()) handleResetPassword();
      } else if (viewState === "otp") {
        if (otpCodes.join("").length === 6) handleVerifyOtp();
      }
    }
  };

  // 1. Password Login
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setInlineError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // If email not verified, transition to OTP verification view
        if (
          error.message.toLowerCase().includes("email not confirmed") ||
          error.message.toLowerCase().includes("email not verified") ||
          error.status === 400 && error.message.toLowerCase().includes("confirm")
        ) {
          setViewState("otp");
          setResendCooldown(30);
          // Try sending OTP if it wasn't sent
          await supabase.auth.resend({
            type: "signup",
            email: email.trim(),
          });
          return;
        }

        setInlineError(error.message);
        return;
      }

      // Successful login
      resetGuestAccess();
      router.push("/chat");
    } catch (err: any) {
      setInlineError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true);
    setInlineError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        },
      });
      if (!error) {
        resetGuestAccess();
      }
      if (error) {
        setInlineError(error.message);
      }
    } catch (err: any) {
      setInlineError(err.message || "Failed to initiate Google login.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Reset Request
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setInlineError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?next=/welcome`,
      });

      if (error) {
        setInlineError(error.message);
        return;
      }

      setViewState("reset_success");
    } catch (err: any) {
      setInlineError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  // 4. OTP Verification
  const handleOtpChange = (val: string, index: number) => {
    const numericVal = val.replace(/[^0-9]/g, "");
    if (!numericVal) {
      const newOtp = [...otpCodes];
      newOtp[index] = "";
      setOtpCodes(newOtp);
      return;
    }

    const singleDigit = numericVal.charAt(numericVal.length - 1);
    const newOtp = [...otpCodes];
    newOtp[index] = singleDigit;
    setOtpCodes(newOtp);

    if (index < 7) {
      focusOtpInput(index + 1);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpCodes[index] && index > 0) {
      focusOtpInput(index - 1);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().replace(/[^0-9]/g, "");
    if (pastedData.length >= 8) {
      const newOtp = pastedData.slice(0, 8).split("");
      setOtpCodes(newOtp);
      focusOtpInput(7);
    }
  };

  const handleVerifyOtp = async () => {
    setInlineError(null);
    setSuccessMessage(null);
    const code = otpCodes.join("");
    if (code.length !== 8) {
      setInlineError("Please enter all 8 digits.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup",
      });

      if (error) {
        setInlineError(error.message);
        return;
      }

      resetGuestAccess();
      router.push("/chat");
    } catch (err: any) {
      setInlineError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    console.log('Resend OTP clicked in login');
    if (resendCooldown > 0) return;
    setInlineError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      console.log('Calling supabase.auth.resend for email:', email.trim());
      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      console.log('Resend result:', { data, error });

      if (error) {
        if (error.status === 429) {
          setInlineError("Please wait a moment before requesting another code.");
        } else {
          setInlineError(error.message);
        }
        return;
      }

      setSuccessMessage("Verification code resent! Check your email.");
      setResendCooldown(30);
      setOtpCodes(Array(8).fill(""));
      focusOtpInput(0);
    } catch (err: any) {
      console.error('Resend error caught:', err);
      setInlineError(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-deeper px-4 py-12 text-white">
      <div 
        onKeyDown={handleKeyDown}
        className="w-full max-w-md bg-ink-deep border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6 relative"
      >
        <Logo />
        {/* Close / Skip Login (X) button — top-right of card */}
        {viewState === "login" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleGuestSkip}
                aria-label="Skip login and continue as guest"
                className="
                  absolute top-4 right-4 sm:top-5 sm:right-5 z-10
                  size-8 rounded-full
                  bg-white/10 backdrop-blur-sm
                  flex items-center justify-center
                  text-zinc-400
                  hover:bg-white/20 hover:text-white hover:scale-110
                  active:scale-95
                  transition-all duration-200
                  cursor-pointer
                "
              >
                <X className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Continue as guest</TooltipContent>
          </Tooltip>
        )}
        {/* Back navigation inside reset password or OTP flow */}
        {viewState !== "login" && (
          <button
            onClick={() => {
              setViewState("login");
              setInlineError(null);
            }}
            disabled={loading}
            className="flex items-center gap-1 text-[13px] font-mono text-zinc-400 hover:text-marigold transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="size-4" />
            BACK TO LOG IN
          </button>
        )}

        {/* ────────────── VIEW STATE: LOGIN ────────────── */}
        {viewState === "login" && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
              <h1 className="font-heading font-extrabold text-2xl tracking-tight">
                Log in
              </h1>
              <p className="text-sm font-sans text-zinc-400">
                Welcome back to BuyWise AI. Enter your details below.
              </p>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-dark font-sans font-bold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.75 2.9C6.15 6.95 8.85 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.25c0-.82-.07-1.6-.2-2.35H12v4.5h6.48c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.7-4.95 3.7-8.6z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.6c-.25-.75-.4-1.55-.4-2.4s.15-1.65.4-2.4L1.5 6.9C.55 8.8 0 10.9 0 13s.55 4.2 1.5 6.1l3.75-2.9-1-.6z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.15 0-5.85-1.91-6.8-4.86l-3.75 2.9C3.4 20.35 7.35 23 12 23z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center my-1">
              <div className="flex-1 h-px bg-line-ondark" />
              <span className="px-3 text-xs font-mono text-zinc-400">OR</span>
              <div className="flex-1 h-px bg-line-ondark" />
            </div>

            {/* Email Input */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 size-5 text-zinc-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-400/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 size-5 text-zinc-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-400/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-zinc-400 hover:text-marigold transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setViewState("reset_password");
                  setInlineError(null);
                }}
                className="text-xs font-mono text-marigold hover:underline transition-all cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </div>
        )}

        {/* ────────────── VIEW STATE: RESET PASSWORD ────────────── */}
        {viewState === "reset_password" && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
              <h1 className="font-heading font-extrabold text-2xl tracking-tight">
                Reset Password
              </h1>
              <p className="text-sm font-sans text-zinc-400">
                {/* reason or tarun`s antigravity */}
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {/* Email Input */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 size-5 text-zinc-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-400/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* ────────────── VIEW STATE: RESET SUCCESS ────────────── */}
        {viewState === "reset_success" && (
          <div className="flex flex-col gap-4 text-center items-center py-4 animate-in scale-in duration-300">
            <CheckCircle2 className="size-14 text-marigold animate-bounce" />
            <h1 className="font-heading font-extrabold text-2xl tracking-tight mt-2">
              Reset Link Sent!
            </h1>
            <p className="text-sm font-sans text-zinc-400 leading-relaxed max-w-xs">
              Check your inbox at <span className="text-white font-semibold">{email}</span> for a link to reset your password.
            </p>
            <Button
              onClick={() => {
                setViewState("login");
                setInlineError(null);
              }}
              className="mt-4 px-6 h-11 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-mono tracking-widest uppercase hover:bg-ink-deeper hover:border-marigold transition-all cursor-pointer"
            >
              Back to log in
            </Button>
          </div>
        )}

        {/* ────────────── VIEW STATE: OTP VERIFICATION ────────────── */}
        {viewState === "otp" && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
              <h1 className="font-heading font-extrabold text-2xl tracking-tight">
                Verify your email
              </h1>
              <p className="text-sm font-sans text-zinc-400 leading-relaxed">
                {/* reason or tarun`s antigravity */}
                Your email isn&apos;t confirmed yet. We&apos;ve sent a verification email to <span className="text-white font-semibold">{email}</span>.
              </p>
              <div className="text-sm font-sans text-white bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 mt-2 shadow-inner">
                <p>👉 <strong className="text-marigold">Option 1:</strong> Click the <strong className="text-marigold">Confirm email address</strong> link in the email to log in directly.</p>
                <p>👉 <strong className="text-marigold">Option 2:</strong> Enter the 8-digit OTP code below (if your Supabase email template is configured to send the code).</p>
              </div>
            </div>

            {/* OTP input boxes */}
            <div className="flex justify-between items-center gap-2 mt-2">
              {otpCodes.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpRefs.current[idx] = el;
                  }}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                  className="w-10 sm:w-12 h-12 sm:h-14 rounded-xl border border-white/10 bg-white/5 text-center font-heading text-lg font-bold text-marigold focus:border-marigold focus:ring-2 focus:ring-marigold/20 outline-none transition-all disabled:opacity-50 min-w-0"
                  disabled={loading}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Resend button */}
            <div className="text-center mt-2 text-xs font-mono">
              {resendCooldown > 0 ? (
                <span className="text-zinc-400">
                  Resend code in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-marigold hover:underline transition-all cursor-pointer disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inline Error Alert banner */}
        {inlineError && (
          <div className="px-4 py-3 bg-chili/10 border border-chili/30 rounded-xl text-chili text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed flex-1">{inlineError}</span>
            <button
              onClick={() => setInlineError(null)}
              className="text-chili hover:text-chili/80 font-bold ml-1 text-sm leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="px-4 py-3 bg-[#2E7E6A]/10 border border-[#2E7E6A]/30 rounded-xl text-[#2E7E6A] text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <div className="font-sans leading-relaxed flex-1">
              {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-[#2E7E6A] hover:text-[#2E7E6A]/80 font-bold ml-1 text-sm leading-none"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Button */}
        {viewState === "login" && (
          <Button
            onClick={handleLogin}
            disabled={loading || !email.trim() || !password}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Log in"
            )}
          </Button>
        )}

        {viewState === "reset_password" && (
          <Button
            onClick={handleResetPassword}
            disabled={loading || !email.trim()}
            className="w-full h-12 bg-marigold text-zinc-900 hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        )}

        {viewState === "otp" && (
          <Button
            onClick={handleVerifyOtp}
            disabled={loading || otpCodes.join("").length !== 8}
            className="w-full h-12 bg-marigold text-zinc-900 hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Verify Code"
            )}
          </Button>
        )}

        {/* Bottom Navigation link */}
        {viewState === "login" && (
          <div className="text-center text-xs font-mono text-zinc-400 mt-2">
            {/* reason or tarun`s antigravity */}
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-marigold hover:underline transition-all">
              Sign up
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
