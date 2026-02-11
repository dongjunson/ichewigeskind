/**
 * Google Drive API 사용량 모니터
 * - 호출 횟수 집계 (in-memory)
 * - 서버 재시작 시 초기화됨
 */

export type DriveOperation = "files.list" | "files.get";

interface UsageRecord {
  operation: DriveOperation;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const usageLog: UsageRecord[] = [];
const MAX_LOG_ENTRIES = 1000;

const counts: Record<DriveOperation, number> = {
  "files.list": 0,
  "files.get": 0,
};

export function recordDriveUsage(
  operation: DriveOperation,
  metadata?: Record<string, unknown>
): void {
  counts[operation] += 1;
  const record: UsageRecord = {
    operation,
    timestamp: Date.now(),
    metadata,
  };
  usageLog.push(record);
  if (usageLog.length > MAX_LOG_ENTRIES) {
    usageLog.shift();
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Drive API] ${operation} | total: ${counts[operation]} | ${new Date().toISOString()}`
    );
  }
}

export function getDriveUsage() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const recent1h = usageLog.filter((r) => r.timestamp >= oneHourAgo);
  const recent24h = usageLog.filter((r) => r.timestamp >= oneDayAgo);

  const byOp1h: Record<DriveOperation, number> = {
    "files.list": recent1h.filter((r) => r.operation === "files.list").length,
    "files.get": recent1h.filter((r) => r.operation === "files.get").length,
  };

  const byOp24h: Record<DriveOperation, number> = {
    "files.list": recent24h.filter((r) => r.operation === "files.list").length,
    "files.get": recent24h.filter((r) => r.operation === "files.get").length,
  };

  return {
    total: { ...counts },
    last1h: { total: recent1h.length, byOperation: byOp1h },
    last24h: { total: recent24h.length, byOperation: byOp24h },
    lastUpdated: now,
  };
}
