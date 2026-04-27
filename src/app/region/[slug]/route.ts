import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * /region/[slug] → /coco/[slug] 301 리다이렉트
 *
 * Footer의 구 링크(/region/서울-강남구 등) 및 Google이 캐싱한
 * 구 URL들을 /coco/ 경로로 영구 이전.
 * GSC 404 오류 해소 목적 (2026-04-21)
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    redirect(`/coco/${slug}`);
}
