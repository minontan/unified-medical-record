// Shared lab result status logic.
// Correctly handles one-sided reference ranges (e.g. ">1.04", ">=20", "<5.2",
// "(>90)", "VALUE GREATER THAN OR EQUAL TO 20.0...") and the spurious opposite
// bounds (0, -1, 9999999) that extraction sometimes emits alongside them.
//
// Returns one of: "text" | "low" | "high" | "normal" | "norange"

export function getLabStatus(row) {
  if (!row) return "norange";
  if (row.text_result) return "text";
  if (row.numeric_result == null) return "text";

  const val = row.numeric_result;
  const refText = (row.reference_range_text || "").toLowerCase();

  let lo = row.reference_range_low;
  let hi = row.reference_range_high;

  // Discard sentinel / placeholder values extraction sometimes emits.
  // Real lab lower bounds are > 0; real upper bounds are < 999999.
  if (lo != null && lo <= 0) lo = null;
  if (hi != null && (hi <= 0 || hi >= 999999)) hi = null;

  // Detect one-sided ranges from the ref text.
  // Lower-bound only: text begins (after optional brackets) with ">" or ">=",
  // OR mentions "greater than". Values at/above the bound are normal.
  const isLowerBoundOnly =
    /^[\(\[]*\s*>=?/.test(refText) || /greater\s+than/.test(refText);
  // Upper-bound only: text begins (after optional brackets) with "<" or "<=",
  // OR mentions "less than". Values at/below the bound are normal.
  const isUpperBoundOnly =
    /^[\(\[]*\s*<=?/.test(refText) || /less\s+than/.test(refText);

  if (isLowerBoundOnly && !isUpperBoundOnly) {
    hi = null;
  } else if (isUpperBoundOnly && !isLowerBoundOnly) {
    lo = null;
  }

  const hasRange = lo != null || hi != null;
  if (!hasRange) return "norange";
  if (lo != null && val < lo) return "low";
  if (hi != null && val > hi) return "high";
  return "normal";
}