import { describe, it, expect } from "vitest";
import { canTransition, getAllowedTransitions } from "@heybrew/shared";
import { assertTransition } from "../src/services/orderTransitions";
import { AppError } from "../src/utils/errors";

describe("order transitions", () => {
  it("allows delivery happy path", () => {
    expect(canTransition("delivery", "pending", "confirmed")).toBe(true);
    expect(canTransition("delivery", "confirmed", "preparing")).toBe(true);
    expect(canTransition("delivery", "preparing", "on_the_way")).toBe(true);
    expect(canTransition("delivery", "on_the_way", "delivered")).toBe(true);
  });

  it("allows pickup happy path", () => {
    expect(canTransition("pickup", "pending", "confirmed")).toBe(true);
    expect(canTransition("pickup", "preparing", "ready_for_pickup")).toBe(true);
    expect(canTransition("pickup", "ready_for_pickup", "collected")).toBe(true);
  });

  it("blocks cross-flow statuses", () => {
    expect(canTransition("delivery", "preparing", "ready_for_pickup")).toBe(false);
    expect(canTransition("pickup", "preparing", "on_the_way")).toBe(false);
    expect(canTransition("delivery", "delivered", "cancelled")).toBe(false);
  });

  it("allows cancel from early states only", () => {
    expect(getAllowedTransitions("delivery", "pending")).toContain("cancelled");
    expect(getAllowedTransitions("delivery", "on_the_way")).not.toContain("cancelled");
  });

  it("assertTransition throws AppError on invalid", () => {
    expect(() => assertTransition("pickup", "pending", "delivered")).toThrow(AppError);
  });
});
