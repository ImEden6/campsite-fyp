import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import ToastNotification from './ToastNotification';

const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const hideToast = useUIStore((state) => state.hideToast);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onClose={hideToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
