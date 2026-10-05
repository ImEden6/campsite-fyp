import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fakeSocket, ioMock, getAuthTokenMock, refreshAuthTokenMock } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const fakeSocket = {
    connected: false,
    handlers,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.set(event, handler);
    }),
    off: vi.fn(),
    onAny: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    io: { on: vi.fn() },
    trigger: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
  };
  return {
    fakeSocket,
    ioMock: vi.fn(() => fakeSocket),
    getAuthTokenMock: vi.fn(),
    refreshAuthTokenMock: vi.fn(),
  };
});

vi.mock('socket.io-client', () => ({ io: ioMock }));
vi.mock('@/services/api/storage', () => ({ getAuthToken: getAuthTokenMock }));
vi.mock('@/services/api/client', () => ({ refreshAuthToken: refreshAuthTokenMock }));

import { webSocketService } from './WebSocketService';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const authOption = () => {
  const options = ioMock.mock.calls.at(-1)?.[1] as { auth: (cb: (data: { token: string }) => void) => void };
  let sent: { token: string } | undefined;
  options.auth((data) => {
    sent = data;
  });
  return sent;
};

describe('WebSocketService authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeSocket.handlers.clear();
    fakeSocket.connected = false;
    getAuthTokenMock.mockReturnValue(null);
    refreshAuthTokenMock.mockResolvedValue('refreshed-token');
    webSocketService.disconnect();
  });

  it('sends the newest stored token on every connection attempt', () => {
    getAuthTokenMock.mockReturnValue('stored-1');
    webSocketService.connect('initial-token');
    expect(authOption()).toEqual({ token: 'stored-1' });

    // The token is refreshed elsewhere (e.g. by a REST call); the next attempt must use it
    getAuthTokenMock.mockReturnValue('stored-2');
    expect(authOption()).toEqual({ token: 'stored-2' });
  });

  it('falls back to the token passed to connect() when nothing is stored', () => {
    webSocketService.connect('initial-token');

    expect(authOption()).toEqual({ token: 'initial-token' });
  });

  it.each(['Token expired', 'Invalid token', 'Authentication required'])(
    'refreshes the token and reconnects once after "%s"',
    async (message) => {
      webSocketService.connect('initial-token');

      fakeSocket.trigger('connect_error', new Error(message));
      await flush();

      expect(refreshAuthTokenMock).toHaveBeenCalledTimes(1);
      expect(fakeSocket.connect).toHaveBeenCalledTimes(2); // the initial connect + the retry
    }
  );

  it('does not refresh for network errors', async () => {
    webSocketService.connect('initial-token');

    fakeSocket.trigger('connect_error', new Error('websocket error'));
    await flush();

    expect(refreshAuthTokenMock).not.toHaveBeenCalled();
  });

  it('does not loop when the server keeps rejecting the token', async () => {
    webSocketService.connect('initial-token');

    fakeSocket.trigger('connect_error', new Error('Token expired'));
    await flush();
    fakeSocket.trigger('connect_error', new Error('Token expired'));
    fakeSocket.trigger('connect_error', new Error('Token expired'));
    await flush();

    expect(refreshAuthTokenMock).toHaveBeenCalledTimes(1);
  });

  it('allows another refresh after a successful connection', async () => {
    webSocketService.connect('initial-token');
    fakeSocket.trigger('connect_error', new Error('Token expired'));
    await flush();

    fakeSocket.trigger('connect'); // reconnected fine
    fakeSocket.trigger('connect_error', new Error('Token expired')); // expired again later
    await flush();

    expect(refreshAuthTokenMock).toHaveBeenCalledTimes(2);
  });

  it('does not reconnect when the refresh fails', async () => {
    refreshAuthTokenMock.mockResolvedValue(null);
    webSocketService.connect('initial-token');

    fakeSocket.trigger('connect_error', new Error('Token expired'));
    await flush();

    expect(fakeSocket.connect).toHaveBeenCalledTimes(1); // only the initial attempt
  });
});
