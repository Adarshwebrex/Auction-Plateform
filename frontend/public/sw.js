const CACHE_NAME = 'antiquexx-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              // Don't cache API calls or auth requests
              if (!event.request.url.includes('/api/') && 
                  !event.request.url.includes('auth') &&
                  event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(() => {
          // Return cached page for navigation requests when offline
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          
          // Return offline fallback for images
          if (event.request.destination === 'image') {
            return new Response(
              '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ccc"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for bid submissions when offline
self.addEventListener('sync', event => {
  if (event.tag === 'bid-sync') {
    event.waitUntil(syncBids());
  }
});

async function syncBids() {
  // Get all pending bids from IndexedDB
  const pendingBids = await getPendingBids();
  
  // Try to submit each bid
  for (const bid of pendingBids) {
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bid.token}`
        },
        body: JSON.stringify(bid.data)
      });
      
      if (response.ok) {
        // Remove bid from pending queue
        await removePendingBid(bid.id);
        
        // Show notification
        self.registration.showNotification('Bid Placed Successfully', {
          body: `Your bid of ${bid.data.amount} has been placed.`,
          icon: '/logo192.png',
          badge: '/logo192.png'
        });
      }
    } catch (error) {
      console.error('Failed to sync bid:', error);
    }
  }
}

// Push notification handler
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New auction activity',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Auction',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AntiqueXX Auction', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app to the specific auction
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingBids() {
  return new Promise((resolve) => {
    const request = indexedDB.open('AntiqueXXDB', 1);
    
    request.onerror = () => resolve([]);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingBids'], 'readonly');
      const store = transaction.objectStore('pendingBids');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => resolve([]);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingBids')) {
        db.createObjectStore('pendingBids', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingBid(bidId) {
  return new Promise((resolve) => {
    const request = indexedDB.open('AntiqueXXDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingBids'], 'readwrite');
      const store = transaction.objectStore('pendingBids');
      store.delete(bidId);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    };
  });
}
