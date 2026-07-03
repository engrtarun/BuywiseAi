"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Lock, 
  Mail, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Loading and Error States
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [viewState, setViewState] = useState<"login" | "reset_password" | "reset_success" | "otp">("login");

  // OTP Verification Specific state
  const [otpCodes, setOtpCodes] = useState<string[]>(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
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

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
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

    if (index < 5) {
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
    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split("");
      setOtpCodes(newOtp);
      focusOtpInput(5);
    }
  };

  const handleVerifyOtp = async () => {
    setInlineError(null);
    const code = otpCodes.join("");
    if (code.length !== 6) {
      setInlineError("Please enter all 6 digits.");
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

      router.push("/chat");
    } catch (err: any) {
      setInlineError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setInlineError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      if (error) {
        setInlineError(error.message);
        return;
      }

      setResendCooldown(30);
      setOtpCodes(Array(6).fill(""));
      focusOtpInput(0);
    } catch (err: any) {
      setInlineError(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-deeper px-4 py-12 text-text-ondark">
      <div 
        onKeyDown={handleKeyDown}
        className="w-full max-w-md bg-ink-deep border border-line-ondark rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6"
      >
        {/* Back navigation inside reset password or OTP flow */}
        {viewState !== "login" && (
          <button
            onClick={() => {
              setViewState("login");
              setInlineError(null);
            }}
            disabled={loading}
            className="flex items-center gap-1 text-[13px] font-mono text-text-dim-ondark hover:text-marigold transition-colors disabled:opacity-50"
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
              <p className="text-sm font-sans text-text-dim-ondark">
                Welcome back to BuyWise AI. Enter your details below.
              </p>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 bg-[#F6EFDD] text-[#1B2B27] rounded-xl hover:bg-[#EDE3C9] font-sans font-bold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
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
              <span className="px-3 text-xs font-mono text-text-dim-ondark">OR</span>
              <div className="flex-1 h-px bg-line-ondark" />
            </div>

            {/* Email Input */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 size-5 text-text-dim-ondark" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-11 bg-ink-deeper/50 border-line-ondark text-text-ondark placeholder:text-text-dim-ondark/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 size-5 text-text-dim-ondark" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pl-11 pr-11 bg-ink-deeper/50 border-line-ondark text-text-ondark placeholder:text-text-dim-ondark/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-text-dim-ondark hover:text-marigold transition-colors cursor-pointer"
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
              <p className="text-sm font-sans text-text-dim-ondark">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Email Input */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 size-5 text-text-dim-ondark" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-11 bg-ink-deeper/50 border-line-ondark text-text-ondark placeholder:text-text-dim-ondark/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
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
            <p className="text-sm font-sans text-text-dim-ondark leading-relaxed max-w-xs">
              Check your inbox at <span className="text-text-ondark font-semibold">{email}</span> for a link to reset your password.
            </p>
            <Button
              onClick={() => {
                setViewState("login");
                setInlineError(null);
              }}
              className="mt-4 px-6 h-11 bg-ink-deeper/50 border border-line-ondark rounded-xl text-text-ondark text-xs font-mono tracking-widest uppercase hover:bg-ink-deeper hover:border-marigold transition-all cursor-pointer"
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
              <p className="text-sm font-sans text-text-dim-ondark leading-relaxed">
                Your email isn't confirmed yet. We've sent a verification email to <span className="text-text-ondark font-semibold">{email}</span>.
              </p>
              <div className="text-xs font-sans text-text-dim-ondark/80 bg-ink-deeper/40 p-3.5 rounded-2xl border border-line-ondark/60 space-y-1.5 mt-1">
                <p>👉 <strong>Option 1:</strong> Click the <strong>Confirm email address</strong> link in the email to log in directly.</p>
                <p>👉 <strong>Option 2:</strong> Enter the 6-digit OTP code below (if your Supabase email template is configured to send the code).</p>
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
                  className="size-11 sm:size-12 rounded-xl border border-line-ondark bg-ink-deeper/50 text-center font-heading text-lg font-bold text-marigold focus:border-marigold focus:ring-2 focus:ring-marigold/20 outline-none transition-all disabled:opacity-50"
                  disabled={loading}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Resend button */}
            <div className="text-center mt-2 text-xs font-mono">
              {resendCooldown > 0 ? (
                <span className="text-text-dim-ondark">
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

        {/* Action Button */}
        {viewState === "login" && (
          <Button
            onClick={handleLogin}
            disabled={loading || !email.trim() || !password}
            className="w-full h-12 bg-marigold text-ink-deeper hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full h-12 bg-marigold text-ink-deeper hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={loading || otpCodes.join("").length !== 6}
            className="w-full h-12 bg-marigold text-ink-deeper hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="text-center text-xs font-mono text-text-dim-ondark mt-2">
            Don't have an account?{" "}
            <a href="/signup" className="text-marigold hover:underline transition-all">
              Sign up
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
