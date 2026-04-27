import React from 'react';
import { Store, List, LogOut, User, CreditCard, Settings, ShieldCheck, Zap, Wallet, Coins } from 'lucide-react';

export const BusinessSidebar = ({
    brand, shopName, nickname, view, setView
}: {
    brand: any, shopName: string, nickname?: string, view: string, setView: (v: any) => void
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [profileImage, setProfileImage] = React.useState<string | null>(null);

    React.useEffect(() => {
        const saved = localStorage.getItem('business_profile_image');
        if (saved) setProfileImage(saved);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setProfileImage(base64String);
                localStorage.setItem('business_profile_image', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const navItems = [
        { id: 'dashboard', label: '진행중인 채용정보', icon: List },
        { id: 'closed-ads', label: '마감된 채용정보', icon: LogOut },
        { id: 'applicants', label: '지원자 관리', icon: User },
        { id: 'sos-alert', label: 'SOS 긴급구인', icon: Zap, highlight: true },
        { id: 'buy-points', label: '추가옵션안내', icon: Wallet },
        { id: 'payments', label: '유료 결제 내역', icon: CreditCard },
        { id: 'point-history', label: '포인트 및 점프 내역', icon: Coins },
        { id: 'member-info', label: '회원정보 수정', icon: Settings, borderTop: true },
    ];

    const activeItemStyle = "bg-blue-50 text-blue-500 rounded-xl";
    const inactiveItemStyle = "hover:bg-blue-50 hover:text-blue-500 rounded-xl transition";

    return (
        <aside className="hidden md:block col-span-1 space-y-4">
            <div className={`p-6 rounded-2xl border shadow-sm text-center flex flex-col justify-center ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} `}>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 cursor-pointer group relative ${brand.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-blue-100'} `}
                >
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Store size={32} /></div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings size={16} className="text-white" />
                    </div>
                </div>
                <div className="mb-4">
                    <h2 className={`font-black text-xl tracking-tight ${brand.theme === 'dark' ? 'text-white' : 'text-black'} `}>
                        {shopName || (nickname === '최고 관리자' ? '관리 센터' : '내 상점')}
                    </h2>
                    {nickname && (
                        <p className={`text-sm font-bold ${brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} `}>
                            {nickname}
                        </p>
                    )}
                    <p className={`text-xs font-bold ${nickname === '최고 관리자' ? 'text-purple-600 bg-purple-50 py-0.5 rounded-full inline-block px-3 border border-purple-100' : (brand.theme === 'dark' ? 'text-gray-400' : 'text-gray-600')} `}>
                        {nickname === '최고 관리자' ? '시스템 최상위 권한' : '프리미엄 인증 업소'}
                    </p>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition ${brand.theme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} `}
                >
                    사진 등록/수정
                </button>
            </div>

            <nav className={`p-4 rounded-2xl border shadow-sm space-y-1 ${brand.theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-100 text-gray-600'} `}>
                {navItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer font-bold text-sm ${item.borderTop ? 'border-t mt-2 pt-4' : ''} ${view === item.id ? activeItemStyle : inactiveItemStyle} ${(item as any).highlight && view !== item.id ? 'text-red-500' : ''}`}
                    >
                        <item.icon size={18} /> {item.label}
                    </div>
                ))}
            </nav>
        </aside>
    );
};
