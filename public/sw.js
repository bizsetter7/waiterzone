// CocoAlba Service Worker — SOS 긴급구인 Web Push 수신 처리
// Stealth 정책: 잠금화면에 업소명/내용 노출 최소화

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = { title: '새 알림이 있습니다', body: '', url: '/' };
    }

    // Stealth 정책: 잠금화면/알림창에는 최소 정보만 표시
    // 실제 내용(업소명, 메시지)은 앱을 열어야 확인 가능
    const notificationOptions = {
        body: payload.stealth ? '탭하여 확인하세요' : (payload.body || ''),
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: payload.tag || 'sos-alert',
        data: {
            url: payload.url || '/',
            alertId: payload.alertId,
        },
        // 진동 최소화 (주변인 인지 방지)
        vibrate: [100, 50, 100],
        // 소리 없음 옵션 (브라우저 설정 따름)
        silent: false,
        // 알림 자동 닫힘 방지 (사용자가 직접 확인)
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(
            payload.stealth ? '새 알림이 있습니다' : (payload.title || '코코알바'),
            notificationOptions
        )
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // 이미 열린 탭이 있으면 포커스
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // 없으면 새 탭 오픈
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
