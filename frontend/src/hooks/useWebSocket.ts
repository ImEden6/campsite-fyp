/**
 * useWebSocket Hook
 * React hook for managing WebSocket connection lifecycle
 */

import { useEffect, useState, useCallback } from 'react';
import { webSocketService } from '@/services/websocket';
import { ConnectionStatus } from '@/services/websocket/types';
import { getAuthToken } from '@/services/api/storage';

/**
 * Hook for managing WebSocket connection
 */
export const useWebSocket = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Update status from service
    const updateStatus = () => {
      const currentStatus = webSocketService.getStatus();
      setStatus(currentStatus);
      setIsConnected(webSocketService.isConnected());
    };

    // Listen for connection events
    const handleConnected = () => {
      updateStatus();
    };

    const handleDisconnected = () => {
      updateStatus();
    };

    const handleReconnected = () => {
      updateStatus();
    };

    const handleError = () => {
      updateStatus();
    };

    window.addEventListener('websocket:connected', handleConnected);
    window.addEventListener('websocket:disconnected', handleDisconnected);
    window.addEventListener('websocket:reconnected', handleReconnected);
    window.addEventListener('websocket:error', handleError);

    // Initial status update
    updateStatus();

    // Auto-connect if token exists and not connected
    const token = getAuthToken();
    if (token && !webSocketService.isConnected()) {
      webSocketService.connect(token);
    }

    return () => {
      window.removeEventListener('websocket:connected', handleConnected);
      window.removeEventListener('websocket:disconnected', handleDisconnected);
      window.removeEventListener('websocket:reconnected', handleReconnected);
      window.removeEventListener('websocket:error', handleError);
    };
  }, []);

  const connect = useCallback(() => {
    const token = getAuthToken();
    if (token) {
      webSocketService.connect(token);
    } else {
      console.warn('[useWebSocket] Cannot connect: No auth token available');
    }
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  return {
    status,
    isConnected,
    connect,
    disconnect,
  };
};
