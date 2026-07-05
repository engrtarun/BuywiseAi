"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, MapPin, CreditCard, Banknote, ShieldCheck, CheckCircle2, Package, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  items: CheckoutItem[];
}

type CheckoutStep = "SUMMARY" | "ADDRESS" | "PAYMENT" | "SUCCESS";

export function CheckoutFlow({ isOpen, onClose, onSuccess, items }: CheckoutFlowProps) {
  const [step, setStep] = useState<CheckoutStep>("SUMMARY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [address, setAddress] = useState({ name: "", line1: "", city: "", pin: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "COD">("UPI");
  
  // Mock payment details state
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // tarun`s antigravity
  const [orderId, setOrderId] = useState("");
  const [estDelivery, setEstDelivery] = useState("");
  
  // Mock checkout only — integrate real payment gateway (Razorpay/Stripe) here for production.

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep("SUMMARY");
      setIsProcessing(false);
    }
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 1000 ? 0 : 40;
  const total = subtotal + deliveryFee;

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep("SUCCESS");
      
      // tarun`s antigravity
      setOrderId(`#BW-${Math.floor(Math.random() * 1000000)}`);
      setEstDelivery(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#ffb067", "#f97316", "#2dd4bf"]
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#ffb067", "#f97316", "#2dd4bf"]
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      if (onSuccess) onSuccess();
    }, 2000);
  };

  const getStepNumber = () => {
    switch (step) {
      case "SUMMARY": return 1;
      case "ADDRESS": return 2;
      case "PAYMENT": return 3;
      case "SUCCESS": return 4;
    }
  };

  const renderStep = () => {
    switch (step) {
      case "SUMMARY":
        return (
          <motion.div
            key="SUMMARY"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full overflow-y-auto p-5 pb-24"
          >
            <h3 className="text-lg font-heading font-bold mb-4">Order Summary</h3>
            <div className="flex flex-col gap-3 flex-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <img src={item.image} alt={item.name} className="size-16 object-cover rounded-lg" />
                  <div className="flex-1 flex flex-col justify-between">
                    <span className="font-semibold text-sm line-clamp-2">{item.name}</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-text-secondary text-xs">Qty: {item.quantity}</span>
                      <span className="font-bold text-brand-accent">₹{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? "text-green-400" : ""}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-brand-accent">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-main/90 backdrop-blur-md border-t border-white/10">
              <button
                onClick={() => setStep("ADDRESS")}
                className="w-full h-12 bg-brand-accent text-bg-main rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Continue to Address <ArrowRight className="size-4" />
              </button>
            </div>
          </motion.div>
        );

      case "ADDRESS":
        return (
          <motion.div
            key="ADDRESS"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full overflow-y-auto p-5 pb-24"
          >
            <h3 className="text-lg font-heading font-bold mb-4">Delivery Address</h3>
            
            <button 
              onClick={() => setAddress({ name: "Demo User", line1: "123 Tech Park", city: "Bengaluru", pin: "560001", phone: "9876543210" })}
              className="w-full mb-4 p-3 border border-brand-accent/50 bg-brand-accent/10 rounded-xl flex items-start gap-3 hover:bg-brand-accent/20 transition-colors text-left"
            >
              <MapPin className="size-5 text-brand-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-brand-accent text-sm">Use saved address</p>
                <p className="text-xs text-text-secondary mt-0.5">Demo User • Bengaluru 560001</p>
              </div>
            </button>

            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Full Name" value={address.name} onChange={e => setAddress({...address, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent/50" />
              <input type="text" placeholder="Address Line 1" value={address.line1} onChange={e => setAddress({...address, line1: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent/50" />
              <div className="flex gap-3">
                <input type="text" placeholder="City" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent/50" />
                <input type="text" placeholder="PIN Code" value={address.pin} onChange={e => setAddress({...address, pin: e.target.value})} className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent/50" />
              </div>
              <input type="tel" placeholder="Phone Number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent/50" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-main/90 backdrop-blur-md border-t border-white/10">
              <button
                onClick={() => setStep("PAYMENT")}
                disabled={!address.name || !address.line1 || !address.city}
                className="w-full h-12 bg-brand-accent text-bg-main rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue to Payment <ArrowRight className="size-4" />
              </button>
            </div>
          </motion.div>
        );

      case "PAYMENT":
        return (
          <motion.div
            key="PAYMENT"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full overflow-y-auto p-5 pb-24"
          >
            <h3 className="text-lg font-heading font-bold mb-4">Payment Method</h3>
            <p className="text-xs text-text-secondary mb-4 italic">Mock payment only — integrate Razorpay/Stripe here for production.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setPaymentMethod("UPI")}
                className={`w-full p-4 border rounded-xl flex items-center gap-3 transition-colors ${paymentMethod === "UPI" ? "border-brand-accent bg-brand-accent/10" : "border-white/10 bg-white/5"}`}
              >
                <div className="size-8 rounded-full bg-[#1A1A18] flex items-center justify-center border border-white/10">
                  <span className="font-bold text-[10px] text-brand-accent">UPI</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">UPI / QR</p>
                  <p className="text-xs text-text-secondary">Google Pay, PhonePe, Paytm</p>
                </div>
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "UPI" ? "border-brand-accent" : "border-white/20"}`}>
                  {paymentMethod === "UPI" && <div className="size-2.5 rounded-full bg-brand-accent" />}
                </div>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${paymentMethod === "UPI" ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="pt-2 pb-4 px-1">
                  <label className="block text-xs text-text-secondary mb-1.5 ml-1">Enter your UPI ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 9876543210@ybl" 
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent/50" 
                    />
                    <button className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors">
                      Verify
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setPaymentMethod("CARD")}
                className={`w-full p-4 border rounded-xl flex items-center gap-3 transition-colors ${paymentMethod === "CARD" ? "border-brand-accent bg-brand-accent/10" : "border-white/10 bg-white/5"}`}
              >
                <div className="size-8 rounded-full bg-[#1A1A18] flex items-center justify-center border border-white/10">
                  <CreditCard className="size-4 text-brand-accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">Credit / Debit Card</p>
                  <p className="text-xs text-text-secondary">Visa, Mastercard, RuPay</p>
                </div>
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "CARD" ? "border-brand-accent" : "border-white/20"}`}>
                  {paymentMethod === "CARD" && <div className="size-2.5 rounded-full bg-brand-accent" />}
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${paymentMethod === "CARD" ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="pt-2 pb-4 px-1 flex flex-col gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1.5 ml-1">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => {
                        // Basic formatting for realism
                        const val = e.target.value.replace(/\D/g, '');
                        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                        setCardNumber(formatted);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent/50" 
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-text-secondary mb-1.5 ml-1">Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        maxLength={5}
                        value={cardExpiry}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                          setCardExpiry(val);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent/50" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-text-secondary mb-1.5 ml-1">CVV</label>
                      <input 
                        type="password" 
                        placeholder="•••" 
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent/50" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setPaymentMethod("COD")}
                className={`w-full p-4 border rounded-xl flex items-center gap-3 transition-colors ${paymentMethod === "COD" ? "border-brand-accent bg-brand-accent/10" : "border-white/10 bg-white/5"}`}
              >
                <div className="size-8 rounded-full bg-[#1A1A18] flex items-center justify-center border border-white/10">
                  <Banknote className="size-4 text-brand-accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm">Cash on Delivery</p>
                  <p className="text-xs text-text-secondary">Pay when you receive</p>
                </div>
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "COD" ? "border-brand-accent" : "border-white/20"}`}>
                  {paymentMethod === "COD" && <div className="size-2.5 rounded-full bg-brand-accent" />}
                </div>
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-main/90 backdrop-blur-md border-t border-white/10">
              <button
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full h-12 bg-brand-accent text-bg-main rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-5" /> Pay ₹{total.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );

      case "SUCCESS":
        return (
          <motion.div
            key="SUCCESS"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col h-full items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="size-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 relative"
            >
              <div className="absolute inset-0 rounded-full border-4 border-green-500/50 animate-ping" />
              <CheckCircle2 className="size-12 text-green-500" />
            </motion.div>
            
            <h2 className="text-2xl font-heading font-extrabold mb-2 text-text-primary-light">Order Placed!</h2>
            <p className="text-text-secondary mb-6 max-w-[250px]">
              Your order has been successfully placed and is being processed.
            </p>

            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-text-secondary">Order ID</span>
                {/* tarun`s antigravity */}
                <span className="font-mono font-bold">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Est. Delivery</span>
                {/* tarun`s antigravity */}
                <span className="font-bold">
                  {estDelivery}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full h-12 bg-white/10 text-white rounded-xl font-bold flex items-center justify-center"
            >
              Back to App
            </button>
          </motion.div>
        );
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full max-h-[800px] sm:h-[650px] bg-bg-main border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        {step !== "SUCCESS" && (
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            {step !== "SUMMARY" ? (
              <button 
                onClick={() => setStep(step === "PAYMENT" ? "ADDRESS" : "SUMMARY")}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <div className="w-9" /> // Spacer
            )}
            
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-text-secondary tracking-widest uppercase">
                Step {getStepNumber()} of 3
              </span>
            </div>

            <button 
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {step !== "SUCCESS" && (
          <div className="w-full h-1 bg-white/5 shrink-0">
            <div 
              className="h-full bg-brand-accent transition-all duration-300"
              style={{ width: `${(getStepNumber() / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-black/20">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

      </div>
    </div>,
    document.body
  );
}
