import {
  canTransition,
  type OrderStatus,
  type OrderType,
  type StatusActor,
} from "@heybrew/shared";
import { badRequest } from "../utils/errors";

export function assertTransition(
  type: OrderType,
  from: OrderStatus,
  to: OrderStatus
): void {
  if (!canTransition(type, from, to)) {
    throw badRequest(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition ${type} order from "${from}" to "${to}"`
    );
  }
}

export function buildStatusHistoryEntry(
  status: OrderStatus,
  actor: StatusActor,
  note?: string
) {
  return {
    status,
    at: new Date(),
    actor,
    ...(note ? { note } : {}),
  };
}
