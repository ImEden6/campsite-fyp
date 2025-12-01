import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * PageLoader - Full page loading indicator for lazy-loaded routes
 * Displays a centered spinner with animation
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-gray-600 text-sm">Loading...</p>
      </motion.div>
    </div>
  );
}
