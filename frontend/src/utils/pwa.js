// PWA utility functions for offline support and push notifications

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                if (window.confirm('New content available! Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

export const unregisterServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    }).catch(error => {
      console.error(error.message);
    });
  }
};

// Push notification subscription
export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push messaging is not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
      });
      
      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSubscription)
      });
      
      return newSubscription;
    }
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Offline bid queue
export class OfflineBidQueue {
  constructor() {
    this.initDB();
  }

  initDB() {
    if (!window.indexedDB) return;
    
    const request = indexedDB.open('AntiqueXXDB', 1);
    
    request.onerror = () => console.error('Failed to open IndexedDB');
    
    request.onsuccess = (event) => {
      this.db = event.target.result;
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingBids')) {
        const store = db.createObjectStore('pendingBids', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  }

  async addBid(bidData) {
    if (!this.db) return false;
    
    const bid = {
      ...bidData,
      timestamp: Date.now(),
      token: localStorage.getItem('token')
    };
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['pendingBids'], 'readwrite');
      const store = transaction.objectStore('pendingBids');
      const request = store.add(bid);
      
      request.onsuccess = () => {
        // Register for background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then(registration => {
            return registration.sync.register('bid-sync');
          });
        }
        resolve(true);
      };
      
      request.onerror = () => resolve(false);
    });
  }

  async getPendingBids() {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['pendingBids'], 'readonly');
      const store = transaction.objectStore('pendingBids');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async clearBid(bidId) {
    if (!this.db) return false;
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction(['pendingBids'], 'readwrite');
      const store = transaction.objectStore('pendingBids');
      const request = store.delete(bidId);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }
}

// Network status monitoring
export const setupNetworkMonitoring = (callback) => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    callback(isOnline);
    
    // Show/hide offline notification
    if (!isOnline) {
      showOfflineNotification();
    } else {
      hideOfflineNotification();
    }
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  // Initial status
  updateNetworkStatus();
  
  return () => {
    window.removeEventListener('online', updateNetworkStatus);
    window.removeEventListener('offline', updateNetworkStatus);
  };
};

const showOfflineNotification = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('Offline Mode', {
        body: 'You are currently offline. Some features may be limited.',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'offline-status'
      });
    });
  }
};

const hideOfflineNotification = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.getNotifications({ tag: 'offline-status' }).then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    });
  }
};

// App install prompt
export const setupInstallPrompt = () => {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button or banner
    showInstallBanner(deferredPrompt);
  });
  
  const installApp = async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    deferredPrompt = null;
    return outcome === 'accepted';
  };
  
  return { installApp };
};

const showInstallBanner = (promptEvent) => {
  // Create and show install banner
  const banner = document.createElement('div');
  banner.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between';
  banner.innerHTML = `
    <div class="flex items-center space-x-3">
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
      </svg>
      <div>
        <div class="font-semibold">Install AntiqueXX</div>
        <div class="text-sm opacity-90">Get the full experience on your device</div>
      </div>
    </div>
    <div class="flex space-x-2">
      <button id="install-dismiss" class="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors">Not now</button>
      <button id="install-accept" class="px-3 py-1 bg-white text-blue-600 rounded hover:bg-white/90 transition-colors">Install</button>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  banner.querySelector('#install-accept').addEventListener('click', () => {
    promptEvent.prompt();
    promptEvent.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      banner.remove();
    });
  });
  
  banner.querySelector('#install-dismiss').addEventListener('click', () => {
    banner.remove();
  });
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.remove();
    }
  }, 10000);
};
