/** Presentation helpers. Money values are minor units (paisa). */

export function formatRs(minor: number): string {
  if (!minor || minor <= 0) return "Price TBA";
  const rupees = minor / 100;
  return `Rs. ${rupees.toLocaleString("en-PK", {
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  })}`;
}

export function formatSaved(minor: number): string {
  if (!minor || minor <= 0) return "";
  return `You saved ${formatRs(minor)}.`;
}
