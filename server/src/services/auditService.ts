import { AuditLog } from "../models/AuditLog";
import { redactObject } from "../utils/logger";

export async function writeAudit(entry: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) {
  await AuditLog.create({
    actorId: entry.actorId,
    actorEmail: entry.actorEmail,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId,
    meta: entry.meta ? redactObject(entry.meta) : undefined,
    ip: entry.ip,
    userAgent: entry.userAgent,
  });
}
