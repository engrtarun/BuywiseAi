"use client";

import React, { useState } from "react";
import { ArrowRight, ListChecks } from "lucide-react";

interface KeyAttribute {
  name: string;
  question: string;
}

interface IntakeQuestionnaireCardProps {
  category: string;
  keyAttributes: KeyAttribute[];
  onSubmit: (message: string) => void;
  disabled?: boolean;
}

export function IntakeQuestionnaireCard({ category, keyAttributes, onSubmit, disabled = false }: IntakeQuestionnaireCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isInteractionDisabled = disabled || hasSubmitted;

  const handleChange = (name: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInteractionDisabled) return;

    // Check if all are answered (or at least one)
    const answerEntries = Object.entries(answers).filter(([_, val]) => val.trim() !== "");
    if (answerEntries.length === 0) return;

    const formattedMessage = answerEntries
      .map(([name, val]) => `For ${name}, my answer is: ${val}`)
      .join("\n");

    setHasSubmitted(true);
    onSubmit(formattedMessage);
  };

  if (!keyAttributes || keyAttributes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[95%] sm:max-w-lg my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full bg-bg-input border border-border-light rounded-2xl shadow-md backdrop-blur-xl overflow-hidden box-border flex flex-col">
        {/* Header Row */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-border-light bg-bg-sidebar/50">
          <div className="flex items-center gap-2">
            <ListChecks className="size-4 text-brand-accent" />
            <h4 className="text-[14px] sm:text-[15px] font-sans font-medium text-text-primary-light/90 leading-snug">
              Finding the right {category}
            </h4>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {keyAttributes.map((attr, idx) => (
            <div key={idx} className="flex flex-col gap-1.5 px-4 py-3 border-b border-border-light">
              <label htmlFor={`attr-${idx}`} className="text-[13px] font-sans font-medium text-text-primary-light/80">
                {attr.question}
              </label>
              <input
                id={`attr-${idx}`}
                type="text"
                value={answers[attr.name] || ""}
                onChange={(e) => handleChange(attr.name, e.target.value)}
                disabled={isInteractionDisabled}
                placeholder="Type here..."
                className="w-full bg-black/5 border border-border-light/50 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-brand-accent/50 focus-visible:ring-1 focus-visible:ring-brand-accent transition-all font-sans text-text-primary-light shadow-inner disabled:opacity-50"
              />
            </div>
          ))}

          <div className="flex justify-end items-center px-4 py-3 bg-bg-sidebar/30">
            <button
              type="submit"
              disabled={isInteractionDisabled || Object.values(answers).every((val) => val.trim() === "")}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-primary-foreground hover:bg-brand-accent/90 disabled:opacity-40 transition-colors font-sans text-[13px] font-semibold cursor-pointer"
            >
              Submit <ArrowRight className="size-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
