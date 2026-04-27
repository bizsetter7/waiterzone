export type AdBlockType = 'main_title' | 'sub_title' | 'description' | 'benefit' | 'salary' | 'contact' | 'spacer';

export interface AdBlock {
    id: string;
    type: AdBlockType;
    values: Record<string, string>;
}

export interface AdTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    themeColor: string;
    renderBlock: (block: AdBlock) => string;
    wrapperHtml: (blocks: AdBlock[], renderedBlocks: string[]) => string;
    defaultBlocks: Omit<AdBlock, 'id'>[];
}

export const AD_TEMPLATES: AdTemplate[] = [
    {
        id: 'luxury-purple',
        name: '럭셔리 퍼플',
        description: '세련된 보라색 테마와 화려한 텍스트 효과의 프리미엄 디자인.',
        thumbnail: 'https://api.placeholder.com/200/4c1d95/ffffff?text=Luxury+Purple',
        themeColor: '#4c1d95',
        defaultBlocks: [
            { type: 'main_title', values: { text: '업계 최GO 페이 보장' } },
            { type: 'sub_title', values: { text: '화려한 글들보다 핵심만 드리고 싶습니다.' } },
            { type: 'benefit', values: { title: '1. 사이즈 안좋으셔도 됩니다.', desc: '외모보다 마인드 하나, 의지만 있으면 됩니다.' } },
            { type: 'benefit', values: { title: '2. 모든 프리미엄일에 초보이셔도 됩니다.', desc: '처음은 누구나 다 어렵습니다. 하나하나 도와드리겠습니다.' } },
            { type: 'salary', values: { text: '최고 페이 보장 + @ 보너스' } },
            { type: 'contact', values: { text: '010-1234-1234' } },
        ],
        wrapperHtml: (_, rendered) => `
<div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 60px 20px; color: white; border-radius: 40px; font-family: 'Pretendard', sans-serif; text-align: center; position: relative; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
    <div style="position: absolute; top: -50px; left: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%); border-radius: 50%;"></div>
    <div style="position: absolute; bottom: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%); border-radius: 50%;"></div>
    ${rendered.join('')}
</div>`,
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<h2 style="font-size: 42px; font-weight: 900; margin: 15px 0; background: linear-gradient(to bottom, #ffffff, #c4b5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">${v.text}</h2>`;
                case 'sub_title': return `<p style="font-size: 15px; color: #a5b4fc; font-weight: 700; opacity: 0.9; margin-bottom: 30px;">${v.text}</p>`;
                case 'benefit': return `
                    <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 25px; text-align: left; margin: 10px 0;">
                        <h3 style="font-size: 20px; font-weight: 900; color: #f472b6; margin-bottom: 8px;">✨ ${v.title}</h3>
                        <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6; font-weight: 500;">${v.desc.replace(/\n/g, '<br/>')}</p>
                    </div>`;
                case 'salary': return `
                    <div style="margin-top: 30px; padding: 25px; background: linear-gradient(to right, #6366f1, #a855f7); border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                        <p style="font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 5px;">SALARY INFO</p>
                        <div style="font-size: 28px; font-weight: 900; color: white;">${v.text}</div>
                    </div>`;
                case 'contact': return `
                    <div style="margin-top: 15px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 15px; color: white;">
                        <span style="font-size: 11px; opacity: 0.7;">CONTACT ME</span>
                        <div style="font-size: 20px; font-weight: 900;">${v.text.replace(/\n/g, '<br/>')}</div>
                    </div>`;
                case 'spacer': return `<div style="height: 30px;"></div>`;
                default: return '';
            }
        }
    },
    {
        id: 'neon-b2b',
        name: '네온 나이트',
        description: '화려한 디스코볼과 네온 조명 효과가 강조된 밤문화 스타일 디자인.',
        thumbnail: 'https://api.placeholder.com/200/000000/ff00ff?text=Neon+b2b',
        themeColor: '#000000',
        defaultBlocks: [
            { type: 'main_title', values: { text: '프리미엄과함께 춤을' } },
            { type: 'sub_title', values: { text: '최고의 조건으로 꿀맛나게 합시다' } },
            { type: 'salary', values: { text: '시급 15~25+@ / 하루 100~150 보장' } },
            { type: 'benefit', values: { title: '모집대상', desc: '20~30대 주부/대한민국 국적이면 OK' } },
            { type: 'benefit', values: { title: '근무시간', desc: '주간조: AM 10:00 ~ PM 06:00 / 야간조: PM 08:00 ~ AM 04:00' } },
            { type: 'contact', values: { text: '010-1234-1234 / 카톡: waiterzone' } },
        ],
        wrapperHtml: (_, rendered) => `
<div style="background: #000 url('https://www.transparenttextures.com/patterns/dark-matter.png'); padding: 60px 20px; color: white; border-radius: 0; font-family: 'Pretendard', sans-serif; text-align: center; border: 2px solid #ff00ff; box-shadow: inset 0 0 50px rgba(255,0,255,0.2), 0 0 20px rgba(255,0,255,0.5);">
    <div style="margin-bottom: 30px;"><img src="https://media.giphy.com/media/l41lSTmSTj82gYhBS/giphy.gif" style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid #00ffff; box-shadow: 0 0 30px #00ffff;"></div>
    ${rendered.join('')}
</div>`,
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<h2 style="font-size: 45px; font-weight: 900; color: #fff; text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff; margin: 20px 0;">${v.text}</h2>`;
                case 'sub_title': return `<p style="font-size: 18px; color: #00ffff; font-weight: 900; text-shadow: 0 0 5px #00ffff; margin-bottom: 30px;">${v.text}</p>`;
                case 'benefit': return `
                    <div style="background: rgba(255,255,255,0.05); border: 2px solid #ff00ff; border-radius: 15px; padding: 20px; margin: 15px 0; box-shadow: 0 0 15px rgba(255,0,255,0.3);">
                        <h3 style="font-size: 22px; font-weight: 900; color: #00ffff; margin-bottom: 10px; text-transform: uppercase;">[ ${v.title} ]</h3>
                        <p style="font-size: 15px; color: #fff; line-height: 1.6; font-weight: 700;">${v.desc.replace(/\n/g, '<br/>')}</p>
                    </div>`;
                case 'salary': return `
                    <div style="margin: 30px 0; padding: 20px; border: 3px double #00ffff; border-radius: 50px; background: rgba(0,255,255,0.1);">
                        <div style="font-size: 24px; font-weight: 900; color: #facc15; text-shadow: 0 0 10px #facc15;">${v.text}</div>
                    </div>`;
                case 'contact': return `
                    <div style="margin-top: 40px; border-top: 1px dashed #ff00ff; padding-top: 20px;">
                        <div style="font-size: 28px; font-weight: 900; color: #fff; letter-spacing: 2px;">${v.text.replace(/\n/g, '<br/>')}</div>
                    </div>`;
                default: return '';
            }
        }
    },
    {
        id: 'red-impact',
        name: '레드 임팩트',
        description: '강렬한 레드 컬러와 원형 요소를 활용한 가독성 높은 디자인.',
        thumbnail: 'https://api.placeholder.com/200/ff0000/ffffff?text=Red+Impact',
        themeColor: '#ff0000',
        defaultBlocks: [
            { type: 'main_title', values: { text: '강남 1등 핫플레이스' } },
            { type: 'sub_title', values: { text: '시스템 1등 / 정통룸 1등 / 중간방 1등' } },
            { type: 'benefit', values: { title: '첫번째', desc: '당일 수급 및 다양한 편의 제공' } },
            { type: 'benefit', values: { title: '두번째', desc: '초보자도 정착할 수 있는 최고의 환경' } },
            { type: 'contact', values: { text: '010-1234-1234 / 카톡: waiterzone' } },
        ],
        wrapperHtml: (blocks, rendered) => {
            const titleIdx = blocks.findIndex(b => b.type === 'main_title');
            const titleHtml = titleIdx > -1 ? rendered[titleIdx] : '<h2 style="font-size: 50px; font-weight: 900; color: #fff; margin: 0;">PREMIUM</h2>';
            const otherHtml = rendered.filter((_, i) => i !== titleIdx).join('');

            return `
<div style="background: #ffffff; padding: 0 0 40px 0; color: #000; border-radius: 24px; font-family: 'Pretendard', sans-serif; text-align: center; overflow: hidden; border: 5px solid #ff0000; box-shadow: 0 15px 35px rgba(255,0,0,0.15);">
    <div style="background: #ff0000; padding: 60px 20px; border-radius: 0 0 50% 50% / 0 0 30% 30%; margin-bottom: 20px;">
        ${titleHtml}
    </div>
    <div style="padding: 0 25px;">
        ${otherHtml}
    </div>
</div>`;
        },
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<h2 style="font-size: 50px; font-weight: 900; color: #fff; margin: 0;">${v.text}</h2>`;
                case 'sub_title': return `<div style="background: #000; color: #fff; padding: 15px; border-radius: 10px; font-weight: 900; margin-bottom: 30px; font-size: 20px;">${v.text}</div>`;
                case 'benefit': return `
                    <div style="margin: 25px 0; border-bottom: 2px solid #ff0000; padding-bottom: 20px;">
                        <h3 style="font-size: 24px; font-weight: 900; color: #ff0000; margin-bottom: 10px;">{{ ${v.title} }}</h3>
                        <p style="font-size: 16px; color: #333; line-height: 1.6; font-weight: 700;">${v.desc.replace(/\n/g, '<br/>')}</p>
                    </div>`;
                case 'contact': return `
                    <div style="margin-top: 30px; background: #ff0000; color: #fff; padding: 25px; border-radius: 40px; font-size: 22px; font-weight: 900;">
                        ${v.text.replace(/\n/g, '<br/>')}
                    </div>`;
                default: return '';
            }
        }
    },
    {
        id: 'cloud-heaven',
        name: '클라우드 헤븐',
        description: '파스텔 블루와 화이트를 활용한 깔끔하고 신선한 분위기의 디자인.',
        thumbnail: 'https://api.placeholder.com/200/e0f2fe/0369a1?text=Cloud+Heaven',
        themeColor: '#e0f2fe',
        defaultBlocks: [
            { type: 'main_title', values: { text: 'HEAVEN 헤븐' } },
            { type: 'sub_title', values: { text: '믿고 따라와주시면 끝까지 책임지겠습니다!' } },
            { type: 'benefit', values: { title: '지역', desc: '서울/경기/인천 전지역 콜 최다 보유' } },
            { type: 'benefit', values: { title: '페이', desc: '1T = 10만원 / 당일 결제 무조건' } },
            { type: 'contact', values: { text: '010-1234-1234 / 카톡: waiterzone' } },
        ],
        wrapperHtml: (blocks, rendered) => {
            const titleIdx = blocks.findIndex(b => b.type === 'main_title');
            const titleHtml = titleIdx > -1 ? rendered[titleIdx] : '<h1 style="margin: 0;">PREMIUM</h1>';
            const otherHtml = rendered.filter((_, i) => i !== titleIdx).join('');

            return `
<div style="background: #e0f2fe; padding: 50px 20px; color: #0369a1; border-radius: 30px; font-family: 'Pretendard', sans-serif; text-align: center; border: 4px solid #fff; box-shadow: 0 15px 40px rgba(0,0,0,0.05);">
    <div style="background: #00ffff; color: #000; font-size: 50px; font-weight: 900; padding: 40px; border-radius: 20px; transform: skewY(-2deg); margin-bottom: 40px; box-shadow: 10px 10px 0 #0369a1;">
        ${titleHtml}
    </div>
    ${otherHtml}
</div>`;
        },
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<h1 style="margin: 0;">${v.text}</h1>`;
                case 'sub_title': return `<p style="font-size: 16px; font-weight: 900; color: #0369a1; background: #fff; padding: 10px 20px; border-radius: 99px; display: inline-block; margin-bottom: 40px;">${v.text}</p>`;
                case 'benefit': return `
                    <div style="background: #fff; border: 3px solid #00ffff; border-radius: 0; padding: 30px; margin: 20px 0; text-align: center; position: relative;">
                        <h3 style="font-size: 22px; font-weight: 900; color: #ff00ff; margin-bottom: 15px;">♥ ${v.title}</h3>
                        <p style="font-size: 15px; color: #444; line-height: 1.8; font-weight: 700;">${v.desc.replace(/\n/g, '<br/>')}</p>
                    </div>`;
                case 'contact': return `
                    <div style="background: #030852; color: #ffff00; padding: 30px; border-radius: 0; font-size: 24px; font-weight: 900; margin-top: 40px;">
                        연락처: ${v.text.replace(/\n/g, '<br/>')}
                    </div>`;
                default: return '';
            }
        }
    },
    {
        id: 'gold-winner',
        name: '골든 위너',
        description: '성공과 신뢰를 상징하는 골드 테마 디자인.',
        thumbnail: 'https://api.placeholder.com/200/27272a/facc15?text=Gold+Winner',
        themeColor: '#18181b',
        defaultBlocks: [
            { type: 'main_title', values: { text: '아자아자 대박나자' } },
            { type: 'sub_title', values: { text: '압도적인 규모! 갯수 미기재 시 100% 보상!' } },
            { type: 'salary', values: { text: '1일 평균 50~70만원 이상!' } },
            { type: 'benefit', values: { title: 'LOCATION', desc: '서울 강남구 역삼동 (역세권 5분)' } },
            { type: 'contact', values: { text: '010-1234-1234 / Kakao: waiterzone' } },
        ],
        wrapperHtml: (_, rendered) => `
<div style="background: #18181b; padding: 50px 20px; color: white; border-radius: 24px; font-family: 'Pretendard', sans-serif; text-align: center; border: 4px solid #facc15; box-shadow: 0 0 20px rgba(250, 204, 21, 0.2);">
    <div style="font-size: 40px; margin-bottom: 10px;">🏆</div>
    ${rendered.join('')}
</div>`,
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<h2 style="font-size: 38px; font-weight: 900; margin: 0; color: #facc15; letter-spacing: -1px; text-transform: uppercase;">${v.text}</h2><div style="width: 40px; height: 2px; background: #facc15; margin: 15px auto;"></div>`;
                case 'sub_title': return `<p style="font-size: 16px; color: #e4e4e7; font-weight: 700; margin-bottom: 30px;">${v.text}</p>`;
                case 'salary': return `
                    <div style="background: rgba(250, 204, 21, 0.1); border: 1px solid #facc15; padding: 25px; border-radius: 20px; margin-bottom: 20px;">
                        <div style="font-size: 24px; font-weight: 900; color: #fff;">${v.text}</div>
                    </div>`;
                case 'benefit': return `
                    <div style="background: #facc15; color: #000; padding: 20px; border-radius: 15px; font-weight: 900; margin: 10px 0;">
                        <div style="font-size: 13px; opacity: 0.7;">📍 ${v.title}</div>
                        <div style="font-size: 17px;">${v.desc}</div>
                    </div>`;
                case 'contact': return `
                    <div style="background: #facc15; color: #000; padding: 20px; border-radius: 15px; font-weight: 900; margin-top: 10px;">
                        <div style="font-size: 13px; opacity: 0.7;">📱 CONTACT</div>
                        <div style="font-size: 20px;">${v.text.replace(/\n/g, '<br/>')}</div>
                    </div>`;
                default: return '';
            }
        }
    },
    {
        id: 'sweet-pink',
        name: '스윗 핑크',
        description: '하트와 리본 요소가 적용된 사랑스러운 분위기의 디자인.',
        thumbnail: 'https://api.placeholder.com/200/fdf2f8/ec4899?text=Sweet+Pink',
        themeColor: '#fff1f2',
        defaultBlocks: [
            { type: 'main_title', values: { text: '김실장 패밀리 모집' } },
            { type: 'sub_title', values: { text: '함께 웃으며 일할 식구들을 모십니다!' } },
            { type: 'benefit', values: { title: '💕 우리들의 약속', desc: '성실함만 있으면OK!\\n친구와 함께 지원 환영!\\n초보자 교육 철저!' } },
            { type: 'salary', values: { text: '1시간 기준 18만 드립니다!' } },
            { type: 'contact', values: { text: '010-1234-1234 / Kakao: waiterzone' } },
        ],
        wrapperHtml: (_, rendered) => `
<div style="background: #fff1f2; padding: 50px 20px; color: #be123c; border-radius: 24px; font-family: 'Pretendard', sans-serif; text-align: center; border: 6px solid #fb7185; position: relative;">
    <div style="position: absolute; top: 10px; left: 10px; font-size: 20px;">💝</div>
    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px;">💝</div>
    ${rendered.join('')}
</div>`,
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<div style="font-size: 24px; font-weight: 900; color: #f43f5e; margin-bottom: 5px;">🎀 FAMILY 🎀</div><h2 style="font-size: 34px; font-weight: 900; margin: 0; color: #e11d48;">${v.text}</h2>`;
                case 'sub_title': return `<p style="font-size: 14px; color: #fb7185; font-weight: 700; margin: 10px 0 30px 0;">${v.text}</p>`;
                case 'benefit': return `
                    <div style="background: white; border-radius: 20px; padding: 25px; border: 2px dashed #fda4af; margin-bottom: 25px; text-align: left;">
                        <div style="font-size: 17px; font-weight: 900; color: #fb7185; margin-bottom: 10px;">${v.title}</div>
                        <div style="font-size: 14px; color: #4b5563; font-weight: 700; line-height: 1.8;">${v.desc.replace(/\n/g, '<br/>')}</div>
                    </div>`;
                case 'salary': return `
                    <div style="background: #fb7185; color: white; padding: 25px; border-radius: 20px; margin-bottom: 15px;">
                        <div style="font-size: 12px; font-weight: 900; margin-bottom: 5px; opacity: 0.9;">SPECIAL SALARY</div>
                        <div style="font-size: 24px; font-weight: 900;">${v.text}</div>
                    </div>`;
                case 'contact': return `
                    <div style="background: rgba(255,255,255,0.5); padding: 15px; border-radius: 12px; font-size: 16px; font-weight: 900; color: #be123c;">
                        연락처: ${v.text.replace(/\n/g, '<br/>')}
                    </div>`;
                default: return '';
            }
        }
    },
    {
        id: 'summer-beach',
        name: '썸머 비치',
        description: '시원한 여름 바다와 휴양지 느낌을 주는 청량한 디자인.',
        thumbnail: 'https://api.placeholder.com/200/0ea5e9/ffffff?text=Summer+Beach',
        themeColor: '#0ea5e9',
        defaultBlocks: [
            { type: 'main_title', values: { text: '지역 최고의 수입보장!' } },
            { type: 'sub_title', values: { text: '저희는 이 구역에서 1등하는 곳입니다. 꼭! 돈 많이 벌게 해 드릴게요' } },
            { type: 'contact', values: { text: '010-1234-1234' } },
            { type: 'benefit', values: { title: '돈 벌이 엄청나요', desc: '믿고 오세용!ㅎ 손님 눈 낮고 사이즈 안 봐요!!!' } },
            { type: 'benefit', values: { title: '100% 당일결제', desc: '타지분들 대환영합니다! 먹자 완전 편하게 가능~!! 개인방 다 준비 돼 이써용^^' } },
            { type: 'salary', values: { text: '진짜 맘 편하게 연락 주셔요^^' } },
            { type: 'contact', values: { text: "010-1234-1234\n카톡: waiterzone" } },
        ],
        wrapperHtml: (_, rendered) => `
<div style="background: linear-gradient(180deg, #a5f3fc 0%, #38bdf8 100%); padding: 60px 20px; color: white; border-radius: 20px; font-family: 'Pretendard', sans-serif; text-align: center; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);">
    <div style="position: absolute; top: 20px; left: 20px; font-size: 40px;">🏖️</div>
    <div style="position: absolute; top: 40px; right: 30px; font-size: 30px;">🍹</div>
    <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); font-size: 100px; opacity: 0.2; pointer-events: none;">🌊</div>
    ${rendered.join('')}
</div>`,
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<h2 style="font-size: 40px; font-weight: 900; color: #fff; text-shadow: 2px 2px 0px #0284c7; margin: 20px 0;">${v.text}</h2>`;
                case 'sub_title': return `<p style="font-size: 16px; color: #fff; font-weight: 700; background: rgba(0,0,0,0.1); display: inline-block; padding: 10px 20px; border-radius: 20px; margin-bottom: 30px;">${v.text}</p>`;
                case 'contact': return `
                    <div style="background: #fff; color: #0284c7; padding: 15px 30px; border-radius: 50px; font-size: 26px; font-weight: 900; margin: 20px 0; border: 4px solid #bae6fd; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        ${v.text.replace(/\n/g, '<br/>')}
                    </div>`;
                case 'benefit': return `
                    <div style="background: rgba(255,255,255,0.9); border-radius: 20px; padding: 25px; margin: 15px 0; color: #0c4a6e; text-align: left; border: 2px dashed #7dd3fc;">
                        <h3 style="font-size: 20px; font-weight: 900; color: #0284c7; margin-bottom: 8px;">🌴 ${v.title}</h3>
                        <p style="font-size: 15px; line-height: 1.6; font-weight: 700;">${v.desc.replace(/\n/g, '<br/>')}</p>
                    </div>`;
                case 'salary': return `
                    <div style="margin: 30px 0; padding: 20px; background: #0284c7; border-radius: 15px; color: white;">
                        <div style="font-size: 18px; font-weight: 900;">${v.text}</div>
                    </div>`;
                default: return '';
            }
        }
    },
    {
        id: 'neon-city',
        name: '네온 시티',
        description: '도시의 밤과 네온 사인을 모티브로 한 현대적인 디자인.',
        thumbnail: 'https://api.placeholder.com/200/1e1b4b/818cf8?text=Neon+City',
        themeColor: '#1e1b4b',
        defaultBlocks: [
            { type: 'main_title', values: { text: '노블레스 OOO' } },
            { type: 'sub_title', values: { text: '강남 1등 하이엔드 룸 / 정통 마담 형님 OOO' } },
            { type: 'contact', values: { text: '010-1234-1234' } },
            { type: 'main_title', values: { text: '이것이 강남이다!!!!!' } },
            { type: 'benefit', values: { title: '점통 인재 마담', desc: '가게 상주 영업 및 직접 관리. 애들만 던져 놓는 영업진 아닙니다.' } },
            { type: 'benefit', values: { title: '머리부터 발끝까지', desc: '세련되고 럭셔리하게 코디 꽃게 해 드립니다.' } },
            { type: 'benefit', values: { title: '철저한 블랙 관리', desc: '광고 손님 X, 10년이상 단골 & 검증된 고급 손님들만 받습니다.' } },
            { type: 'salary', values: { text: '지원금 최소 200만 ~ 300만 + @' } },
            { type: 'contact', values: { text: '010-1234-1234' } },
        ],
        wrapperHtml: (_, rendered) => `
<div style="background: #0f172a; padding: 50px 20px; color: white; border-radius: 0; font-family: 'Pretendard', sans-serif; text-align: center; border: 2px solid #6366f1; box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);">
    <div style="font-size: 12px; letter-spacing: 5px; color: #818cf8; margin-bottom: 20px;">PREMIUM LOUNGE</div>
    ${rendered.join('')}
</div>`,
        renderBlock: (block) => {
            const v = block.values;
            switch (block.type) {
                case 'main_title': return `<h2 style="font-size: 36px; font-weight: 900; color: #fff; text-shadow: 0 0 10px #818cf8; margin: 30px 0; border: 2px solid #818cf8; padding: 15px; border-radius: 10px; display: inline-block;">${v.text}</h2>`;
                case 'sub_title': return `<p style="font-size: 16px; color: #c7d2fe; font-weight: 500; margin-bottom: 20px;">${v.text}</p>`;
                case 'contact': return `
                    <div style="margin: 20px auto; border: 1px solid #4f46e5; padding: 15px; width: fit-content; border-radius: 10px; color: #a5b4fc; font-size: 20px; font-weight: 700;">
                        ${v.text.replace(/\n/g, '<br/>')}
                    </div>`;
                case 'benefit': return `
                    <div style="background: linear-gradient(90deg, rgba(99,102,241,0.1) 0%, rgba(79,70,229,0.1) 100%); border-left: 4px solid #6366f1; padding: 20px; margin: 15px 0; text-align: left;">
                        <h3 style="font-size: 18px; font-weight: 900; color: #818cf8; margin-bottom: 5px;">${v.title}</h3>
                        <p style="font-size: 14px; color: #e2e8f0; line-height: 1.6;">${v.desc.replace(/\n/g, '<br/>')}</p>
                    </div>`;
                case 'salary': return `
                    <div style="margin: 40px 0; padding: 20px; border: 2px solid #c084fc; border-radius: 50px; background: rgba(192, 132, 252, 0.1);">
                        <div style="font-size: 22px; font-weight: 900; color: #e879f9;">${v.text}</div>
                    </div>`;
                default: return '';
            }
        }
    }
];
