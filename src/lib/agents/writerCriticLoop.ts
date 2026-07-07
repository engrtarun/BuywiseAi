export interface ValidationReport {
  is_valid: boolean;
  sanitized_payload: string;
  error_diagnostic_trace?: string;
}

export async function runWriterCriticValidationLoop(
  rawWriterOutput: string, 
  schemaTargetMode: "explore" | "deep_research"
): Promise<ValidationReport> {
  const startTime = performance.now();
  let inspectionText = rawWriterOutput.replace(/```json|```/g, "").trim();
  try {
    const verifiedObject = JSON.parse(inspectionText);
    
    // Validate strict structural field interfaces bounds checking criteria
    if (schemaTargetMode === "explore") {
      if (verifiedObject.ui_type === "explore_carousel" && Array.isArray(verifiedObject.products)) {
        return { is_valid: true, sanitized_payload: inspectionText };
      }
    } else if (schemaTargetMode === "deep_research") {
      if (["intake_questionnaire", "deep_research_results", "unrecognized", "clarifying_question", "results"].includes(verifiedObject.ui_type)) {
        return { is_valid: true, sanitized_payload: inspectionText };
      }
    }
    
    throw new Error("Target Schema UI-Type mismatch or structure fields broken properties parameters.");
  } catch (parseException: any) {
    console.warn("Critic validation failure triggered self-correction loop routing intercept validation.");
    
    return {
      is_valid: false,
      sanitized_payload: "",
      error_diagnostic_trace: parseException.message || "Unknown schema processing evaluation break criteria logic sets."
    };
  } finally {
    const endTime = performance.now();
    console.log(`[writerCriticLoop] Execution completed in ${(endTime - startTime).toFixed(2)}ms`);
  }
}
