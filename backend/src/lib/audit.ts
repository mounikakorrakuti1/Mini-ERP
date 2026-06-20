import { AuditAction, Prisma } from '@prisma/client';
export const audit = (
  tx: Prisma.TransactionClient,
  actorId: string | undefined,
  module: string,
  recordType: string,
  recordId: string,
  action: AuditAction,
  fieldName?: string,
  oldValue?: unknown,
  newValue?: unknown,
) =>
  tx.auditLog.create({
    data: {
      actorId,
      module,
      recordType,
      recordId,
      action,
      fieldName,
      oldValue: oldValue == null ? undefined : String(oldValue),
      newValue: newValue == null ? undefined : String(newValue),
    },
  });
