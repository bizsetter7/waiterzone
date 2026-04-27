import { permanentRedirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import shopsData from '@/lib/data/shops.json';
import { slugify } from '@/utils/shopUtils';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function LegacyShopRedirect({ params }: Props) {
    const { id } = await params;

    // 1. shopsData에서 상점 검색 (레거시 목업)
    const staticShop = (shopsData as any[]).find(s => s.id === id);
    if (staticShop?.region) {
        const rawRegion = staticShop.region.replace(/\[|\]/g, '').trim();
        const regionSlug = slugify(rawRegion.normalize('NFC'));
        if (regionSlug) permanentRedirect(`/coco/${encodeURIComponent(regionSlug)}/${id}`);
    }

    // 2. Supabase 실제 공고 조회
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: shop } = await supabase
        .from('shops')
        .select('id, region')
        .eq('id', Number(id))
        .single();

    if (shop?.region) {
        const regionSlug = slugify(shop.region.normalize('NFC'));
        if (regionSlug) permanentRedirect(`/coco/${encodeURIComponent(regionSlug)}/${id}`);
    }

    permanentRedirect('/jobs');
}
