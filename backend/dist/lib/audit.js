'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.audit = void 0;
const audit = (tx, actorId, module, recordType, recordId, action, fieldName, oldValue, newValue) =>
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
exports.audit = audit;
