import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/requireAdmin';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    const authError = await requireAdmin(req);
    if (authError) return authError;
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const bucket = (formData.get('bucket') as string) || 'job-images';
        const folder = (formData.get('folder') as string) || 'banners';

        if (!file) {
            return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        // Node / Edge 환경 호환을 위해 ArrayBuffer 변환
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);

        // Supabase Admin을 통한 RLS 우회 업로드
        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(fileName, fileData, {
                contentType: file.type || 'application/octet-stream',
                upsert: false
            });

        if (uploadError) {
            console.error('[Upload API] Supabase error:', uploadError);
            throw new Error(uploadError.message || '업로드 중 오류 발생');
        }

        // 퍼블릭 URL 가져오기
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return NextResponse.json({ publicUrl, fileName }, { status: 200 });

    } catch (error: any) {
        console.error('[Upload API] Server error:', error);
        return NextResponse.json(
            { error: error.message || '서버 내부 오류로 업로드에 실패했습니다.' },
            { status: 500 }
        );
    }
}
