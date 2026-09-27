/** Money stored as integer minor units (paisa). 1 PKR = 100 paisa. */

export type MinorAmount = number;

export function toMinor(rupees: number): MinorAmount {
  if (!Number.isFinite(rupees)) {
    throw new Error("Invalid rupee amount");
  }
  return Math.round(rupees * 100);
}

export function fromMinor(minor: MinorAmount): number {
  if (!Number.isInteger(minor)) {
    throw new Error("Minor amount must be an integer");
  }
  return minor / 100;
}

export function formatPkr(minor: MinorAmount): string {
  const rupees = fromMinor(minor);
  return `Rs ${rupees.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function assertNonNegativeMinor(minor: MinorAmount, label = "amount"): MinorAmount {
  if (!Number.isInteger(minor) || minor < 0) {
    throw new Error(`${label} must be a non-negative integer (paisa)`);
  }
  return minor;
}

export function addMinor(...amounts: MinorAmount[]): MinorAmount {
  return amounts.reduce((sum, a) => {
    assertNonNegativeMinor(a);
    return sum + a;
  }, 0);
}

export function percentOfMinor(amount: MinorAmount, percent: number): MinorAmount {
  assertNonNegativeMinor(amount);
  if (!Number.isFinite(percent) || percent < 0) {
    throw new Error("percent must be a non-negative number");
  }
  return Math.round((amount * percent) / 100);
}
