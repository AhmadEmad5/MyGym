export const pageTransition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const microTransition = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const springSnappy = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.75,
};
