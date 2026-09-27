export function cartLineKey(parts: {
  productId: string;
  variantId?: string | null;
  modifiers: Array<{ groupId: string; optionId: string }>;
  notes?: string | null;
}): string {
  const mods = [...parts.modifiers]
    .map((m) => `${m.groupId}:${m.optionId}`)
    .sort()
    .join(",");
  const notes = (parts.notes || "").trim();
  return `${parts.productId}|${parts.variantId || ""}|${mods}|${notes}`;
}
