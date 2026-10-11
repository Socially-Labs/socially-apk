/** Keep the field visible without resetting a user's scroll position when it already fits. */
export function focusedFieldScrollDelta(top: number, bottom: number, fieldTop: number, fieldHeight: number, requestedClearance = 16) {
  if (bottom <= top || fieldHeight <= 0) return 0;
  const clearance = Math.min(requestedClearance, Math.max(8, bottom - top - fieldHeight - 16));
  if (fieldTop + fieldHeight + clearance > bottom) return fieldTop + fieldHeight + clearance - bottom;
  if (fieldTop < top + 8) return fieldTop - top - 8;
  return 0;
}
