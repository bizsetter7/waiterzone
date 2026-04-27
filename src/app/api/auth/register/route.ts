import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, password, name, phone, email, type, businessName, businessNumber, marketingConsent } = body;

        // 1. Basic Validation
        if (!id || !password || !name || !phone) {
            return NextResponse.json({ success: false, message: '필수 항목이 누락되었습니다.' }, { status: 400 });
        }

        // 2. Load Users Data
        const dataDetailsPath = path.join(process.cwd(), 'src', 'data', 'users.json');

        // Ensure directory exists (redundant safety)
        const dir = path.dirname(dataDetailsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Read or initialize data
        let users = [];
        if (fs.existsSync(dataDetailsPath)) {
            const fileContent = fs.readFileSync(dataDetailsPath, 'utf-8');
            try {
                users = JSON.parse(fileContent);
                if (!Array.isArray(users)) users = [];
            } catch (error) {
                users = [];
            }
        }

        // 3. Check for Duplicate ID
        const existingUser = users.find((user: { id: string }) => user.id === id);
        if (existingUser) {
            return NextResponse.json({ success: false, message: '이미 존재하는 아이디입니다.' }, { status: 409 });
        }

        // 4. Create New User Object
        const newUser = {
            id,
            password, // Note: In a real app, hash this! Storing plain text for this prototype as requested.
            name,
            phone,
            email: email || '',
            type: type || 'individual', // 'individual' or 'corporate'
            businessName: type === 'corporate' ? businessName : undefined,
            businessNumber: type === 'corporate' ? businessNumber : undefined,
            marketingConsent: !!marketingConsent,
            createdAt: new Date().toISOString(),
            status: type === 'corporate' ? 'pending' : 'active', // Corporate users might need approval
        };

        // 5. Save Data
        users.push(newUser);
        fs.writeFileSync(dataDetailsPath, JSON.stringify(users, null, 2), 'utf-8');

        return NextResponse.json({ success: true, message: '회원가입이 완료되었습니다.' });

    } catch {
        console.error('Registration Error');
        return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
