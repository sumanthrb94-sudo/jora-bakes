import { onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export class NotificationService {
  private static permissionRequested = false;

  static async requestPermission() {
    if (this.permissionRequested) return;
    this.permissionRequested = true;

    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  static async sendLocalNotification(title: string, body: string, icon?: string) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: icon || '/favicon.ico' });
    }
    // Also show a toast as a fallback/redundancy
    toast.success(`${title}: ${body}`, {
      duration: 5000,
      position: 'top-right',
    });
  }

  static listenToOrderUpdates(userId: string) {
    if (!userId) return () => {};

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    // Track previous statuses to only notify on change
    const statusCache: Record<string, string> = {};

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const currentStatus = orderData.status;

        if (change.type === 'modified') {
          const previousStatus = statusCache[orderId];
          
          if (previousStatus && previousStatus !== currentStatus) {
            const statusMessages: Record<string, string> = {
              'confirmed': 'Your order has been confirmed!',
              'baking': 'Zora has started baking your treats!',
              'quality_check': 'Your order is undergoing a final quality check.',
              'out_for_delivery': 'Your artisanal goodies are out for delivery!',
              'delivered': 'Enjoy your treats! Your order has been delivered.',
            };

            const message = statusMessages[currentStatus] || `Your order status is now: ${currentStatus.replace('_', ' ')}`;
            this.sendLocalNotification(`Order Update #${orderId.slice(-6)}`, message);
          }
        }
        
        // Update cache
        statusCache[orderId] = currentStatus;
      });
    });
  }
}
