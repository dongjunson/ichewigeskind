import { NextResponse } from "next/server";

/**
 * 배포 환경에서도 GA 측정 ID를 런타임에 읽기 위해 사용.
 * NEXT_PUBLIC_* 는 빌드 시 인라인되므로, 빌드 시점에 변수가 없으면 배포 시 스크립트가 빠짐.
 * 이 API는 요청 시점의 env를 사용하므로 Vercel에 변수만 설정해도 재배포 없이 동작할 수 있음.
 */
export async function GET() {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? null;
  return NextResponse.json(
    { gaMeasurementId },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
