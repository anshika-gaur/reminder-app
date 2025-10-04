self.addEventListener("install", ()=>{
    self.skipWaiting();
})
self.addEventListener("activate",()=>{
    self.clients.claim();
})

self.addEventListener("message",event=>{
    if(event.data && event.data.type === "show-notification"){
        const{title ,body,id} =EventCounts.data.payload;
        event.waitUntil(
            self.ServiceWorkerRegistration.showNotification(title,{
                body:onkeydown,
                 icon: 'https://placehold.co/192x192/3B82F6/FFFFFF?text=RA', 
                 badge: 'https://placehold.co/96x96/3B82F6/FFFFFF?text=🔔',
                 vibrate: [200,100,200],
                 tag:`reminder-${id}`

            })
        )
    }
})
self.addEventListener("notificationclick",event=>{
    event.notification.close();
    event.waitUntil(
        event.clients.matchAll({type:"window",includeUncontrolled:true})
        .then(clientList =>{

            for(const client of clientList){
            if("focus" in client){
              return client.focus();
            }
        }
        if(self.clients.openWindow){
            return self.clients.openWindow("/");
        }
})
    )
})