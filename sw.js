const CACHE = 'dkdk-v2';
let scheduledAlarms = [];
let checkInterval = null;

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); startChecking(); });

// 메인 앱(index.html)에서 보내는 알림 예약을 받는 곳
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'SCHEDULE_ALARMS') {
    // 기존 예약 다 비우고 새 예약 대기열로 교체
    scheduledAlarms = e.data.alarms || [];
    startChecking();
  } else if (e.data.type === 'ACK_ALARMS') {
    // 사용자가 앱을 열어 확인 완료하면 반복 알림 대기열 청소
    scheduledAlarms = [];
  }
});

// 백그라운드에서 주기적으로 시간을 체크하는 엔진
function startChecking() {
  if (checkInterval) return;

  // 10초마다 체크하여 백그라운드가 잠들어도 안정적으로 알림이 오도록 세팅
  checkInterval = setInterval(() => {
    if (scheduledAlarms.length === 0) {
      clearInterval(checkInterval);
      checkInterval = null;
      return;
    }

    const now = Date.now();
    
    // 배열을 돌며 시간이 된 알림을 찾아 띄우기
    scheduledAlarms.forEach((alarm, index) => {
      if (now >= alarm.time) {
        
        // 기존 코드의 진동과 무조건 화면 유지 옵션(requireInteraction) 결합
        self.registration.showNotification(alarm.title, {
          body: alarm.body,
          tag: alarm.id,
          requireInteraction: true, 
          vibrate: [300, 100, 300, 100, 300],
          data: { url: self.registration.scope }
        });

        // '확인할 때까지 반복' 옵션이 켜져 있으면 20초 뒤에 또 울리도록 시간 갱신
        if (alarm.repeat) {
          alarm.time = now + 20000;
        } else {
          // 일회성 알림이면 대기열에서 제거
          scheduledAlarms.splice(index, 1);
        }
      }
    });
  }, 10000);
}

// 알림창 클릭 시 기존에 열려있는 앱 창으로 초점을 맞춰 이동하는 기존 로직 유지
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.registration.scope) && 'focus' in c) return c.focus();
      }
      return clients.openWindow(self.registration.scope);
    })
  );
});
