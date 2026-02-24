export function applyHealthSafety(text: string): string {
  // Disclaimer is now handled in the UI
  return text.trim();
}

export function enforceHealthRules(question: string): string | null {
  const q = question.toLowerCase();
  const risky = [
    /diagnostic|diagnostiq/,
    /prescription|prescrire/,
    /ordonnance/,
    /urgence|saignement abondant|douleur intense/,
  ];
  if (risky.some((r) => r.test(q))) {
    return 'Je ne peux pas fournir de diagnostic ni de prescription. Si la situation est préoccupante, consultez un professionnel de santé ou les urgences.';
  }
  return null;
}
