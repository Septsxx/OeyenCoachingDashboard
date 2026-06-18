self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Oeyen Coaching', {
      body: data.body || '',
      icon: '/img/oeyen-coaching.png',
      badge: '/img/oeyen-coaching.png',
      tag: data.tag || 'oeyen-coaching',
      data: { url: data.url || '/client/log' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const url = event.notification.data?.url || '/client/log'
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
