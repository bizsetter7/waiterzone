import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
    try {
        const { reason, detail, contact } = await req.json();
        if (!reason) return NextResponse.json({ error: '신고 사유 필요' }, { status: 400 });

        const content = [
            '[허위광고 신고]',
            `신고 사유: ${reason}`,
            detail ? `상세 내용: ${detail}` : null,
            contact ? `연락처: ${contact}` : null,
        ].filter(Boolean).join('\n');

        const { error } = await supabase.from('messages').insert({
            sender_id: 'anonymous',
            sender_name: '익명 신고자',
            receiver_id: 'admin',
            receiver_name: '관리자',
            content,
            status: 'report',
        });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
