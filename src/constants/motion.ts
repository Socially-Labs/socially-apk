/** Shared pacing for small feedback, navigation and interruptible gestures. */
export const Motion = {
  feedback: 140,
  reveal: 180,
  transition: 260,
  pressScale: 0.975,
  pressSpring: { damping: 24, stiffness: 420, mass: 0.6 },
  releaseSpring: { damping: 22, stiffness: 360, mass: 0.6 },
  settleSpring: { duration: 260, dampingRatio: 0.94 },
} as const;
