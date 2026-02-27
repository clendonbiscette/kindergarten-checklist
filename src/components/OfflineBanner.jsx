import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const getQueueCount = () => {
  try {
    const raw = localStorage.getItem('ohpc_offline_queue');
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
};

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queueCount, setQueueCount] = useState(getQueueCount());

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      setQueueCount(getQueueCount());
    };

    const refreshCount = () => setQueueCount(getQueueCount());

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    window.addEventListener('ohpc-queue-updated', refreshCount);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('ohpc-queue-updated', refreshCount);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-medium py-2 px-4 shadow-md">
      <WifiOff size={16} className="shrink-0" />
      <span>
        You&apos;re offline.
        {queueCount > 0
          ? ` ${queueCount} assessment${queueCount !== 1 ? 's' : ''} queued — will sync when reconnected.`
          : ' Assessments will be queued and synced when you reconnect.'}
      </span>
    </div>
  );
};

export default OfflineBanner;
