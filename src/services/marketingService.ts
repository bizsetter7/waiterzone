import { supabase } from '@/lib/supabase';

// Types
export interface MarketingTarget {
    id: string;
    name: string;
    phone_number: string;
    first_name?: string; // Derived or stored
    shop_name?: string;
    industry?: string;
    industry_detail?: string; // 2nd Level Industry
    region_city?: string;
    region_gu?: string;
    kakao_id?: string;
    telegram_id?: string;
    line_id?: string;
    status: 'new' | 'contacted' | 'converted' | 'bounced' | 'opt_out';
    source_site?: string; // Added for lint fix
    source_url?: string;
    source_urls?: string[];
    batch_id?: string;
    created_at: string;
    is_adult?: boolean; // Added for Adult Verification Filter
    phone_number_2?: string; // Secondary Phone Number
}

export interface Campaign {
    id: string;
    title: string;
    message_content: string;
    channel: 'sms' | 'lms' | 'kakao' | 'telegram';
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
    recipient_count: number;
    created_at: string;
}

/**
 * Fetch marketing targets with optional filters and sorting
 */
export const getMarketingTargets = async (filters?: {
    region_city?: string;
    region_gu?: string;
    industry?: string;
    industry_detail?: string;
    status?: string;
    search?: string;
    is_adult?: string; // 'true' | 'false'
    page?: number;
    limit?: number;
    orderBy?: string; // Column name
    orderAsc?: boolean;
    batch_id?: string;
}) => {
    let query = supabase
        .from('marketing_targets')
        .select('*', { count: 'exact' });

    if (filters?.batch_id) {
        query = query.eq('batch_id', filters.batch_id);
    }
    if (filters?.region_city) {
        query = query.eq('region_city', filters.region_city);
    }
    if (filters?.region_gu) {
        query = query.eq('region_gu', filters.region_gu);
    }
    if (filters?.industry) {
        query = query.eq('industry', filters.industry);
    }
    if (filters?.industry_detail) {
        // Assuming column name is 'industry_detail' or we map it
        // If DB column doesn't exist, this will fail. For now, let's assume it might not exist 
        // and we handle it in memory (mock) if query fails, or we just try to query it.
        // Given we are mocking 'is_adult', let's trust the schema has detailed fields or we will mock them.
        query = query.eq('industry_detail', filters.industry_detail);
    }
    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,shop_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const column = filters?.orderBy || 'created_at';
    const ascending = filters?.orderAsc !== undefined ? filters.orderAsc : false;

    const { data, error, count } = await query
        .range(from, to)
        .order(column, { ascending });

    if (error) throw error;

    // Simulate is_adult data (Mock enrichment)
    // In production, this should be a JOIN with profiles table or a real column
    let targets = (data as MarketingTarget[]).map(t => ({
        ...t,
        // Deterministic mock based on ID to prevent flip-flopping on refresh
        is_adult: t.is_adult !== undefined ? t.is_adult : (parseInt(t.id.substring(0, 2), 16) % 10 < 7)
    }));

    // Apply is_adult filter in memory (since it's mocked)
    if (filters?.is_adult) {
        const isVerifiedPartnerBool = filters.is_adult === 'true';
        targets = targets.filter(t => t.is_adult === isVerifiedPartnerBool);
    }

    // Recalculate count if filtered in memory (Approximate for mock)
    const effectiveCount = filters?.is_adult ? targets.length : (count || 0);

    return { data: targets, count: effectiveCount };
};

/**
 * Create or Update a marketing target (Upsert)
 */
export const upsertMarketingTarget = async (target: Partial<MarketingTarget>) => {
    // Basic validation
    if (!target.phone_number) throw new Error('Phone number is required');

    const { data, error } = await supabase
        .from('marketing_targets')
        .upsert([target], { onConflict: 'phone_number' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Delete multiple marketing targets
 */
export const deleteMarketingTargets = async (ids: string[]) => {
    const { error } = await supabase
        .from('marketing_targets')
        .delete()
        .in('id', ids);

    if (error) throw error;
    return true;
};

/**
 * Remove a specific source URL from a marketing target
 */
export const removeMarketingTargetLink = async (id: string, urlToRemove: string) => {
    // 1. Get current data
    const { data, error: getError } = await supabase
        .from('marketing_targets')
        .select('source_url, source_urls')
        .eq('id', id)
        .single();

    if (getError) throw getError;

    const currentUrls = data.source_urls || [];
    const updatedUrls = currentUrls.filter((url: string) => url !== urlToRemove);

    const updates: any = { source_urls: updatedUrls };

    // Also clear secondary column if it matches
    if (data.source_url === urlToRemove) {
        updates.source_url = null;
    }

    // 2. Update
    const { error: updateError } = await supabase
        .from('marketing_targets')
        .update(updates)
        .eq('id', id);

    if (updateError) throw updateError;
    return true;
};

/**
 * Delete an entire upload batch and its targets
 */
export const deleteUploadBatch = async (batchId: string) => {
    // 1. Delete associated targets
    const { error: targetError } = await supabase
        .from('marketing_targets')
        .delete()
        .eq('batch_id', batchId);

    if (targetError) throw targetError;

    // 2. Delete history record
    const { error: historyError } = await supabase
        .from('marketing_upload_history')
        .delete()
        .eq('id', batchId);

    if (historyError) throw historyError;
    return true;
};

/**
 * Update the display name of an upload batch
 */
export const updateUploadBatchName = async (batchId: string, newName: string) => {
    const { error } = await supabase
        .from('marketing_upload_history')
        .update({ filename: newName })
        .eq('id', batchId);

    if (error) throw error;
    return true;
};

/**
 * Delete a marketing target
 */
export const deleteMarketingTarget = async (id: string) => {
    const { error } = await supabase
        .from('marketing_targets')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

/**
 * Update a marketing target
 */
export const updateMarketingTarget = async (id: string, updates: Partial<MarketingTarget>) => {
    const { error } = await supabase
        .from('marketing_targets')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
    return true;
};

/**
 * Mock Sending Function (To be replaced with Solapi/CoolSMS)
 */
export const sendCampaignMessage = async (campaignData: Partial<Campaign>, targets: MarketingTarget[]) => {

    // 1. Create Campaign Record
    const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .insert([{
            title: campaignData.title,
            message_content: campaignData.message_content,
            channel: campaignData.channel,
            recipient_count: targets.length,
            status: 'sending',
            target_filter: {}, // In real app, store the filter used
        }])
        .select()
        .single();

    if (campaignError) throw campaignError;

    // 2. Call Server API for Sending
    try {
        const response = await fetch('/api/marketing/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId: campaign.id,
                message: campaignData.message_content,
                targets: targets,
                channel: campaignData.channel
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Server sending failed');
        }

        // Return simplified result
        return {
            success: true,
            campaignId: campaign.id,
            successCount: result.summary?.success || 0,
            failedCount: result.summary?.failed || 0
        };

    } catch (error: any) {
        console.error('Campaign Send Error:', error);
        // Mark as failed in DB if API call crashed completely (optional redundancy)
        await supabase
            .from('marketing_campaigns')
            .update({ status: 'failed', error_log: error.message })
            .eq('id', campaign.id);

        throw error;
    }
};

/**
 * Fetch upload history batches
 */
export const getUploadHistory = async () => {
    const { data, error } = await supabase
        .from('marketing_upload_history')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Upload Marketing Targets from Excel/CSV (Improved Mapping, Upsert & Batch tracking)
 */
export const uploadMarketingTargets = async (file: File) => {
    const XLSX = await import('xlsx');

    return new Promise<{
        success: boolean,
        count: number,
        total: number,
        duplicates: number,
        batch_id?: string,
        apiResult?: any
    }>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const binaryStr = e.target?.result;
                const workbook = XLSX.read(binaryStr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (!jsonData || jsonData.length === 0) {
                    throw new Error('No data found in file');
                }

                // 1. Create Batch Session
                const { data: batch, error: batchError } = await supabase
                    .from('marketing_upload_history')
                    .insert([{ filename: file.name }])
                    .select()
                    .single();

                if (batchError) throw batchError;

                // 2. Map & Filter
                const targetsToInsert = jsonData.map((row: any) => {
                    const findVal = (keys: string[]) => {
                        const key = Object.keys(row).find(k => {
                            const cleanK = k.toLowerCase().trim();
                            return keys.some(targetK => cleanK === targetK || cleanK.includes(targetK));
                        });
                        return key ? row[key] : '';
                    };

                    const rawPhone = findVal(['phone', '번호', '연락처', '전법', 'hp']);
                    const cleanPhone = rawPhone ? String(rawPhone).replace(/[^0-9]/g, '') : '';

                    const rawPhone2 = findVal(['phone2', '전화번호2', '번호2', '연락처2', '추가연락처']);
                    const cleanPhone2 = rawPhone2 ? String(rawPhone2).replace(/[^0-9]/g, '') : '';

                    const shopName = findVal(['shop_name', '업체명', '상호명', '상호', '상소']);
                    const rawRegion = findVal(['region', '지역', '주소']);
                    const rawUrl = findVal(['url', '링크', '사이트', '주소', '수집경로']);
                    const rawSource = findVal(['site', '유입경로', '출처', 'source']) || 'Upload';

                    let city = '';
                    let gu = '';
                    if (String(rawRegion).includes('>')) {
                        [city, gu] = String(rawRegion).split('>').map((s: string) => s.trim());
                    } else if (String(rawRegion).includes(' ')) {
                        const parts = String(rawRegion).split(' ').map((s: string) => s.trim()).filter(Boolean);
                        city = parts[0] || '';
                        gu = parts.slice(1).join(' ') || '';
                    } else {
                        city = String(rawRegion);
                    }

                    return {
                        batch_id: batch.id,
                        name: findVal(['이름', 'name']) || shopName || 'Unknown',
                        phone_number: cleanPhone,
                        phone_number_2: cleanPhone2,
                        shop_name: shopName || '',
                        industry: findVal(['work_type', '업종', '분류', 'work', 'industry']) || '',
                        industry_detail: findVal(['상세업종', '업종상세', 'detail']) || '',
                        region_city: city,
                        region_gu: gu,
                        kakao_id: findVal(['kakao', '카톡', '카카오톡', 'kakao_id']) || '',
                        telegram_id: findVal(['telegram', '텔레', '텔레그램', 'telegram_id']) || '',
                        source_site: rawSource,
                        source_url: rawUrl || '',
                        source_urls: rawUrl ? [rawUrl] : [],
                        status: 'new',
                        created_at: new Date().toISOString()
                    };
                }).filter(t => t.phone_number.length >= 8);

                const totalInFile = targetsToInsert.length;

                // 2.5 Aggregate in-memory to merge duplicates
                const aggregatedMap = new Map<string, any>();

                targetsToInsert.forEach(t => {
                    const existing = aggregatedMap.get(t.phone_number);
                    if (existing) {
                        // Merge logic
                        // 1. URLs
                        if (t.source_url && !existing.source_urls.includes(t.source_url)) {
                            existing.source_urls.push(t.source_url);
                        }
                        // 2. Shop Names (Keep unique ones)
                        if (t.shop_name && !existing.shop_name.includes(t.shop_name)) {
                            existing.shop_name = existing.shop_name ? `${existing.shop_name}, ${t.shop_name}` : t.shop_name;
                        }
                        // 3. Messenger IDs (Update if empty)
                        if (!existing.kakao_id) existing.kakao_id = t.kakao_id;
                        if (!existing.telegram_id) existing.telegram_id = t.telegram_id;

                        // 4. Phone 2 (Update if empty)
                        if (!existing.phone_number_2 && t.phone_number_2) {
                            existing.phone_number_2 = t.phone_number_2;
                        }
                    } else {
                        aggregatedMap.set(t.phone_number, t);
                    }
                });

                const finalTargets = Array.from(aggregatedMap.values());
                const duplicateCount = totalInFile - finalTargets.length;

                if (finalTargets.length === 0) {
                    throw new Error('No valid targets found (Check phone numbers)');
                }

                // 3. Bulk Upsert
                const { data, error } = await supabase
                    .from('marketing_targets')
                    .upsert(finalTargets, { onConflict: 'phone_number' })
                    .select();

                if (error) {
                    console.error('Supabase Upsert Error:', error);
                    throw new Error(`Database Error: ${error.message} (${error.code})`);
                }

                // 4. Update Batch Stats
                await supabase
                    .from('marketing_upload_history')
                    .update({
                        total_count: totalInFile,
                        unique_count: finalTargets.length,
                        duplicate_count: duplicateCount
                    })
                    .eq('id', batch.id);

                resolve({
                    success: true,
                    count: finalTargets.length,
                    total: totalInFile,
                    duplicates: duplicateCount,
                    batch_id: batch.id,
                    apiResult: data
                });

            } catch (error: any) {
                console.error('Processing Error:', error);
                reject(error instanceof Error ? error : new Error(JSON.stringify(error)));
            }
        };

        reader.onerror = () => {
            console.error('FileReader Error:', reader.error);
            reject(new Error(`File Read Error: ${reader.error?.message}`));
        };
        reader.readAsBinaryString(file);
    });
};
