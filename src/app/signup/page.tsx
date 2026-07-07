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
  User, 
  Check, 
  Loader2, 
  ShieldAlert,
  ArrowRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function SignupPage(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    document.title = "BuyWise AI - Sign Up";
  }, []);

  // Multi-step flow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCodes, setOtpCodes] = useState<string[]>(Array(8).fill(""));

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [shake, setShake] = useState(false);

  // OTP input refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password requirements checklist
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password && password === confirmPassword;
  const isPasswordStrong = hasMinLength && hasNumber && hasUppercase;

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus helper for OTP
  const focusOtpInput = (index: number) => {
    if (otpRefs.current[index]) {
      otpRefs.current[index]?.focus();
    }
  };

  // Keyboard navigation: Enter triggers step submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step === 1) {
        if (name.trim()) handleNextStep();
      } else if (step === 2) {
        if (validateEmail(email)) handleNextStep();
      } else if (step === 3) {
        if (isPasswordStrong && passwordsMatch) handleNextStep();
      } else if (step === 4) {
        const fullOtp = otpCodes.join("");
        if (fullOtp.length === 8) handleSubmitOtp();
      }
    }
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  // Step transitions & validation
  const triggerError = (msg: string) => {
    setInlineError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleNextStep = async () => {
    setInlineError(null);
    setSuccessMessage(null);
    setDirection(1);

    if (step === 1) {
      if (!name.trim()) {
        triggerError("Please enter your name.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!validateEmail(email)) {
        triggerError("Please enter a valid email address.");
        return;
      }

      setLoading(true);
      try {
        // Query profiles table by email
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (error) {
          console.error("Profiles check error:", error);
          // If profiles table doesn't exist or has an issue, log but don't block registration
        }

        if (profile) {
          triggerError("Account already exists — log in instead");
          setLoading(false);
          return;
        }

        setStep(3);
      } catch (err: any) {
        console.error("Verification error:", err);
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      if (!isPasswordStrong) {
        triggerError("Password does not meet the strength requirements.");
        return;
      }
      if (!passwordsMatch) {
        triggerError("Passwords do not match.");
        return;
      }

      // Initiate Supabase Auth Sign Up
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          triggerError(error.message);
          return;
        }

        setStep(4);
        setResendCooldown(30);
      } catch (err: any) {
        triggerError(err.message || "An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevStep = () => {
    setInlineError(null);
    setSuccessMessage(null);
    setDirection(-1);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Google OAuth Login
  const handleGoogleSignUp = async () => {
    setInlineError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setInlineError(error.message);
      }
    } catch (err: any) {
      setInlineError(err.message || "Failed to initiate Google sign-in.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (val: string, index: number) => {
    // Only accept numeric inputs
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

    // Auto-advance focus
    if (index < 7 && singleDigit) {
      focusOtpInput(index + 1);
    }
    
    // Auto-submit
    if (newOtp.join("").length === 8) {
      handleSubmitOtp(newOtp.join(""));
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
      handleSubmitOtp(newOtp.join(""));
    }
  };

  // Submit OTP
  const handleSubmitOtp = async (codeParam?: string) => {
    setInlineError(null);
    const code = codeParam || otpCodes.join("");
    if (code.length !== 8) {
      triggerError("Please enter all 8 digits of the verification code.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (error) {
        setInlineError(error.message);
        return;
      }

      // Successful signup, redirect
      router.push("/chat");
    } catch (err: any) {
      triggerError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    console.log('Resend OTP clicked');
    if (resendCooldown > 0) return;
    setInlineError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      console.log('Calling supabase.auth.resend for email:', email);
      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      console.log('Resend result:', { data, error });

      if (error) {
        // Handle specific rate-limit / generic errors better for UX
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

  // Calculate password strength indicator label and styling
  const getPasswordStrength = () => {
    if (!password) return { label: "", color: "bg-transparent", width: "w-0" };
    let score = 0;
    if (hasMinLength) score++;
    if (hasNumber) score++;
    if (hasUppercase) score++;

    if (score === 1) return { label: "Weak", color: "bg-chili", width: "w-1/3" };
    if (score === 2) return { label: "Medium", color: "bg-marigold", width: "w-2/3" };
    return { label: "Strong", color: "bg-[#2E7E6A]", width: "w-full" };
  };

  const strength = getPasswordStrength();

  // Animation variants
  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 50 : -50,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0
      };
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink-deeper px-4 py-12 text-white">
      <div 
        onKeyDown={handleKeyDown}
        className="w-full max-w-md bg-ink-deep border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6"
      >
        <Logo />
        {/* Top Header */}
        <div className="flex items-center justify-between w-full">
          {step > 1 && (
            <button
              onClick={handlePrevStep}
              disabled={loading}
              className="flex items-center gap-1 text-[13px] font-mono text-zinc-400 hover:text-marigold transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="size-4" />
              BACK
            </button>
          )}
          <div className="text-[11px] font-mono tracking-widest text-marigold uppercase ml-auto">
            STEP {step} OF 4
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-line-ondark rounded-full overflow-hidden">
          <div 
            className="h-full bg-marigold transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Main Content Area */}
        <div className="relative overflow-hidden min-h-[260px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Name */}
            {step === 1 && (
              <motion.div 
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className={`w-full flex flex-col gap-4 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
              >
              <div className="flex flex-col gap-2">
                <h1 className="font-heading font-extrabold text-2xl tracking-tight">
                  What's your name?
                </h1>
                <p className="text-sm font-sans text-zinc-400">
                  Let us know how to address you inside the assistant.
                </p>
              </div>

              <div className="relative flex items-center">
                <User className="absolute left-3.5 size-5 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-400/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Email & Google */}
          {step === 2 && (
            <motion.div 
              key="step2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className={`w-full flex flex-col gap-4 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
            >
              <div className="flex flex-col gap-2">
                <h1 className="font-heading font-extrabold text-2xl tracking-tight">
                  Sign up
                </h1>
                <p className="text-sm font-sans text-zinc-400">
                  Use your email or continue with a social account.
                </p>
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-dark font-sans font-bold text-sm transition-all shadow-md"
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
                Sign up with Google
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
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-400/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <motion.div 
              key="step3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className={`w-full flex flex-col gap-4 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
            >
              <div className="flex flex-col gap-2">
                <h1 className="font-heading font-extrabold text-2xl tracking-tight">
                  Create password
                </h1>
                <p className="text-sm font-sans text-zinc-400">
                  Keep your account secure with a strong password.
                </p>
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
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-zinc-400 hover:text-marigold transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 size-5 text-zinc-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-11 pr-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-400/60 focus-visible:border-marigold focus-visible:ring-marigold/30"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-zinc-400 hover:text-marigold transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>

              {/* Strength Indicator Bar */}
              {password && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">Password strength:</span>
                    <span className={strength.label === "Weak" ? "text-chili" : strength.label === "Medium" ? "text-marigold" : "text-[#2E7E6A]"}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-line-ondark rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                </div>
              )}

              {/* Password Requirements List */}
              <ul className="text-xs font-mono text-zinc-400 flex flex-col gap-1.5 mt-1">
                <li className="flex items-center gap-2">
                  <span className={`size-4 rounded-full border border-current flex items-center justify-center shrink-0 ${hasMinLength ? "text-marigold border-marigold bg-marigold/10" : ""}`}>
                    {hasMinLength && <Check className="size-3" />}
                  </span>
                  8+ characters
                </li>
                <li className="flex items-center gap-2">
                  <span className={`size-4 rounded-full border border-current flex items-center justify-center shrink-0 ${hasNumber ? "text-marigold border-marigold bg-marigold/10" : ""}`}>
                    {hasNumber && <Check className="size-3" />}
                  </span>
                  At least 1 number
                </li>
                <li className="flex items-center gap-2">
                  <span className={`size-4 rounded-full border border-current flex items-center justify-center shrink-0 ${hasUppercase ? "text-marigold border-marigold bg-marigold/10" : ""}`}>
                    {hasUppercase && <Check className="size-3" />}
                  </span>
                  At least 1 uppercase letter
                </li>
              </ul>
            </motion.div>
          )}

          {/* Step 4: OTP Verification */}
          {step === 4 && (
            <motion.div 
              key="step4"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className={`w-full flex flex-col gap-4 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
            >
              <div className="flex flex-col gap-2">
                <h1 className="font-heading font-extrabold text-2xl tracking-tight">
                  Verify your email
                </h1>
                <p className="text-sm font-sans text-zinc-400 leading-relaxed">
                  We've sent a verification email to <span className="text-white font-semibold">{email}</span>.
                </p>
                <div className="text-sm font-sans text-white bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 mt-2 shadow-inner">
<<<<<<< HEAD
                  <p className="flex items-center gap-1.5"><ArrowRight className="size-4 text-marigold" /> <strong className="text-marigold">Option 1:</strong> Click the <strong className="text-marigold">Confirm email address</strong> link in the email to log in directly.</p>
                  <p className="flex items-center gap-1.5"><ArrowRight className="size-4 text-marigold" /> <strong className="text-marigold">Option 2:</strong> Enter the 6-digit OTP code below (if your Supabase email template is configured to send the code).</p>
=======
                  <p>👉 <strong className="text-marigold">Option 1:</strong> Click the <strong className="text-marigold">Confirm email address</strong> link in the email to log in directly.</p>
                  <p>👉 <strong className="text-marigold">Option 2:</strong> Enter the 8-digit OTP code below (if your Supabase email template is configured to send the code).</p>
>>>>>>> 4df6b7ef83fd0869e6055f387af678f9e283d219
                </div>
              </div>

              {/* Six Digits OTP Box */}
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
                    className={`w-10 sm:w-12 h-12 sm:h-14 rounded-xl bg-white/5 text-center font-heading text-lg font-bold outline-none transition-all disabled:opacity-50 min-w-0
                      ${shake 
                        ? 'border-2 border-chili text-chili focus:border-chili focus:ring-2 focus:ring-chili/20' 
                        : 'border border-white/10 text-marigold focus:border-marigold focus:ring-2 focus:ring-marigold/20'
                      }
                    `}
                    disabled={loading}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {/* Resend Cooldown Code */}
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
                    className="text-marigold hover:underline transition-all disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Inline Error Alert */}
        {inlineError && (
          <div className="px-4 py-3 bg-chili/10 border border-chili/30 rounded-xl text-chili text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <div className="font-sans leading-relaxed flex-1">
              {inlineError.includes("Account already exists") ? (
                <>
                  Account already exists —{" "}
                  <a href="/login" className="underline font-bold hover:text-chili/80">
                    log in instead
                  </a>
                </>
              ) : (
                inlineError
              )}
            </div>
            <button
              onClick={() => setInlineError(null)}
              className="text-chili hover:text-chili/80 font-bold ml-1 text-sm leading-none"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="px-4 py-3 bg-[#2E7E6A]/10 border border-[#2E7E6A]/30 rounded-xl text-[#2E7E6A] text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
            <Check className="size-4 shrink-0 mt-0.5" />
            <div className="font-sans leading-relaxed flex-1">
              {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-[#2E7E6A] hover:text-[#2E7E6A]/80 font-bold ml-1 text-sm leading-none"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Continue / Submit Button */}
        {step < 4 ? (
          <Button
            onClick={handleNextStep}
            disabled={
              loading ||
              (step === 1 && !name.trim()) ||
              (step === 2 && !validateEmail(email)) ||
              (step === 3 && (!isPasswordStrong || !passwordsMatch))
            }
            className="w-full h-12 bg-marigold text-zinc-900 hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                Continue
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => handleSubmitOtp()}
            disabled={loading || otpCodes.join("").length !== 8}
            className="w-full h-12 bg-marigold text-zinc-900 hover:bg-marigold-dark rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                Verify Code
              </>
            )}
          </Button>
        )}

        {/* Login Link bottom */}
        <div className="text-center text-xs font-mono text-zinc-400 mt-2">
          Already have an account?{" "}
          <a href="/login" className="text-marigold hover:underline transition-all">
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}
