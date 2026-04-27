import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/requireAdmin';

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const data = await request.json();

        // Define the path to the JSON file
        // Note: In a real Vercel deployment, we cannot write to the file system permanently.
        // This admin feature is designed to be used LOCALLY. 
        // The user edits data locally -> saves to file -> commits & pushes to git -> triggers deployment.

        const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'shops.json');

        // Basic validation
        if (!Array.isArray(data)) {
            return NextResponse.json({ success: false, message: 'Invalid data format' }, { status: 400 });
        }

        // Write file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

        return NextResponse.json({ success: true, message: 'File saved successfully! Now please commit via GitHub Desktop.' });

    } catch (error) {
        console.error('Save error:', error);
        return NextResponse.json({ success: false, message: 'Failed to save file' }, { status: 500 });
    }
}
