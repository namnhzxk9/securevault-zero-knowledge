export type PasswordStrength = {
  score: number;
  label: "Weak" | "Medium" | "Strong";
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label: PasswordStrength["label"] = "Weak";

  if (score >= 4) {
    label = "Strong";
  } else if (score >= 3) {
    label = "Medium";
  }

  return {
    score,
    label,
    checks,
  };
}