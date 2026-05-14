const CACHE='dkdk-v2';
const pendingAlarms={};

self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(clients.claim());});

self.addEventListener('message',e=>{
  if(!e.data||e.data.type!=='SCHEDULE_ALARMS') return;
  Object.keys(pendingAlarms).forEach(k=>{clearTimeout(pendingAlarms[k]);delete pendingAlarms[k];});
  const now=Date.now();
  (e.data.alarms||[]).forEach(alarm=>{
    const delay=alarm.time-now;
    if(delay<=0) return;
    pendingAlarms[alarm.id]=setTimeout(()=>{
      self.registration.showNotification(alarm.title,{
        body:alarm.body,
        tag:alarm.id,
        requireInteraction:true,
        vibrate:[300,100,300,100,300],
        data:{url:self.registration.scope}
      });
      delete pendingAlarms[alarm.id];
    },delay);
  });
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){
        if(c.url.includes(self.registration.scope)&&'focus' in c) return c.focus();
      }
      return clients.openWindow(self.registration.scope);
    })
  );
});
