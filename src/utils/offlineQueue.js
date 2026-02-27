/**
 * Offline assessment queue — persists pending saves to localStorage
 * and replays them when connectivity is restored.
 */

const QUEUE_KEY = 'ohpc_offline_queue';

export const offlineQueue = {
  getAll() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  _notify() {
    window.dispatchEvent(new CustomEvent('ohpc-queue-updated'));
  },

  add(assessmentData) {
    const queue = this.getAll();
    queue.push({ ...assessmentData, _queuedAt: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    this._notify();
    return queue.length;
  },

  remove(index) {
    const queue = this.getAll();
    queue.splice(index, 1);
    if (queue.length === 0) {
      localStorage.removeItem(QUEUE_KEY);
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
    this._notify();
  },

  incrementFailure(index) {
    const queue = this.getAll();
    if (!queue[index]) return;
    queue[index]._failureCount = (queue[index]._failureCount || 0) + 1;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    // No _notify — count didn't change, no UI update needed
  },

  clear() {
    localStorage.removeItem(QUEUE_KEY);
    this._notify();
  },

  count() {
    return this.getAll().length;
  },
};
