// Who receives booking events: rooms, not broadcast.
// Real http server + socket.io clients; only the database and cache are mocked.

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import type { Server } from 'socket.io';
import { io as connectClient, type Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const { prismaMock, cacheMock } = vi.hoisted(() => ({
  prismaMock: { user: { findUnique: vi.fn(), findFirst: vi.fn() } },
  cacheMock: { get: vi.fn(), set: vi.fn() },
}));

vi.mock('@/database', () => ({ default: prismaMock, getPrismaClient: () => prismaMock }));
vi.mock('@/services/cache.service', () => ({ default: cacheMock }));

import { config } from '@/config';
import { createSocketServer } from '@/socket/server';
import { publishBookingEvent, BOOKING_EVENTS, type BookingEventPayload } from '@/socket/booking-events';
import { roomsFor, userRoom, STAFF_ROOM } from '@/socket/rooms';
import socketService from '@/services/socket.service';

const USERS: Record<string, { id: string; role: string }> = {
  alice: { id: 'alice', role: 'CUSTOMER' },
  bob: { id: 'bob', role: 'CUSTOMER' },
  stella: { id: 'stella', role: 'STAFF' },
  mia: { id: 'mia', role: 'MANAGER' },
  ada: { id: 'ada', role: 'ADMIN' },
};

const tokenFor = (name: string) =>
  jwt.sign({ userId: USERS[name]!.id, email: `${name}@example.com`, role: USERS[name]!.role }, config.jwt.secret, { expiresIn: '1h' });

// A booking owned by alice
const booking = (overrides: Partial<BookingEventPayload> = {}): BookingEventPayload => ({
  id: 'bk-1',
  userId: 'alice',
  siteId: 'site-1',
  status: 'PENDING',
  checkInDate: new Date('2034-01-01'),
  checkOutDate: new Date('2034-01-03'),
  bookingNumber: 'BK-1',
  ...overrides,
});

describe('rooms', () => {
  it('puts every user in their own room, and staff roles in the staff room', () => {
    expect(roomsFor({ id: 'u1', role: 'CUSTOMER' })).toEqual(['user:u1']);
    for (const role of ['STAFF', 'MANAGER', 'ADMIN']) {
      expect(roomsFor({ id: 'u1', role })).toEqual(['user:u1', STAFF_ROOM]);
    }
    expect(userRoom('u1')).toBe('user:u1');
  });

  it('exposes no way to broadcast to every client', () => {
    expect((socketService as unknown as Record<string, unknown>).emit).toBeUndefined();
  });
});

describe('booking events over real sockets', () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: Server;
  let url: string;
  let clients: ClientSocket[] = [];
  const received = new Map<ClientSocket, Array<{ event: string; data: unknown }>>();

  beforeAll(async () => {
    httpServer = createServer();
    io = createSocketServer(httpServer); // the same factory index.ts uses
    socketService.initialize(io);
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await io.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cacheMock.get.mockResolvedValue(null);
    prismaMock.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      const user = USERS[where.id];
      return user && { ...user, email: `${user.id}@example.com`, firstName: user.id, lastName: 'T', isActive: true, isEmailVerified: true };
    });
  });

  afterEach(() => {
    clients.forEach((c) => c.close());
    clients = [];
    received.clear();
    clientsByUser.clear();
  });

  const connect = async (name: string): Promise<ClientSocket> => {
    const client = connectClient(url, { auth: { token: tokenFor(name) }, transports: ['websocket'], reconnection: false, forceNew: true });
    clients.push(client);
    received.set(client, []);
    client.onAny((event, data) => received.get(client)!.push({ event, data }));
    await new Promise<void>((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
    });
    // The server joins rooms on its own 'connection' handler; wait until that has run
    await vi.waitFor(async () => {
      const sockets = await io.fetchSockets();
      expect(sockets.some((s) => s.id === client.id && s.rooms.has(userRoom(USERS[name]!.id)))).toBe(true);
    });
    return client;
  };

  const clientsByUser = new Map<ClientSocket, string>();
  const connectAs = async (name: string) => {
    const client = await connect(name);
    clientsByUser.set(client, name);
    return client;
  };

  /**
   * Prove a client did NOT get an event without sleeping: send it a sentinel afterwards and wait for
   * that. Events on one connection arrive in order, so if the earlier event was coming it is already here.
   */
  const settle = async (...list: ClientSocket[]) => {
    for (const client of list) {
      socketService.emitToRooms([userRoom(clientsByUser.get(client)!)], 'sentinel', {});
      await vi.waitFor(() => expect(received.get(client)!.some((e) => e.event === 'sentinel')).toBe(true));
    }
  };

  const eventsOf = (client: ClientSocket, name = BOOKING_EVENTS.created) => received.get(client)!.filter((e) => e.event === name);

  it('delivers a new booking to staff, managers, admins and the owner only', async () => {
    const [alice, bob, stella, mia, ada] = await Promise.all(['alice', 'bob', 'stella', 'mia', 'ada'].map(connectAs));

    publishBookingEvent(BOOKING_EVENTS.created, booking());
    await settle(alice!, bob!, stella!, mia!, ada!);

    for (const entitled of [alice!, stella!, mia!, ada!]) {
      expect(eventsOf(entitled)).toHaveLength(1);
      expect(eventsOf(entitled)[0]!.data).toMatchObject({ id: 'bk-1', bookingNumber: 'BK-1', userId: 'alice' });
    }
    expect(eventsOf(bob!)).toHaveLength(0); // another customer never sees it
  });

  it('does not leak a customer\'s booking to other customers, even across events', async () => {
    const [alice, bob] = await Promise.all(['alice', 'bob'].map(connectAs));

    publishBookingEvent(BOOKING_EVENTS.created, booking({ id: 'a-1' }));
    publishBookingEvent(BOOKING_EVENTS.cancelled, booking({ id: 'a-1', status: 'CANCELLED' }));
    publishBookingEvent(BOOKING_EVENTS.created, booking({ id: 'b-1', userId: 'bob', bookingNumber: 'BK-B' }));
    await settle(alice!, bob!);

    expect(received.get(alice!)!.filter((e) => e.event.startsWith('booking:')).map((e) => (e.data as { id: string }).id)).toEqual(['a-1', 'a-1']);
    expect(received.get(bob!)!.filter((e) => e.event.startsWith('booking:')).map((e) => (e.data as { id: string }).id)).toEqual(['b-1']);
  });

  it('delivers once to a staff member who also owns the booking', async () => {
    const stella = await connectAs('stella');

    publishBookingEvent(BOOKING_EVENTS.created, booking({ userId: 'stella' }));
    await settle(stella);

    expect(eventsOf(stella)).toHaveLength(1);
  });

  it('delivers to every open connection of the same user', async () => {
    const [alice1, alice2] = await Promise.all([connectAs('alice'), connectAs('alice')]);

    publishBookingEvent(BOOKING_EVENTS.created, booking());
    await vi.waitFor(() => expect(eventsOf(alice1!)).toHaveLength(1));
    await vi.waitFor(() => expect(eventsOf(alice2!)).toHaveLength(1));
  });

  it('sends only ids, number, status and dates - no personal details', async () => {
    const alice = await connectAs('alice');

    publishBookingEvent(BOOKING_EVENTS.created, {
      ...booking(),
      // Extra fields a caller might pass by passing a whole Prisma row must not leak
      ...({ guestName: 'Alice Anderson', email: 'alice@example.com', phone: '555-0100', totalAmount: 99 } as object),
    } as BookingEventPayload);
    await settle(alice);

    expect(Object.keys(eventsOf(alice)[0]!.data as object).sort()).toEqual(
      ['bookingNumber', 'checkInDate', 'checkOutDate', 'id', 'siteId', 'status', 'userId']
    );
  });

  it('cannot be tricked into the staff room by the client', async () => {
    const bob = await connectAs('bob');

    // Whatever a client emits, the server has no handler that joins rooms
    for (const attempt of ['join', 'join_room', 'joinRoom', 'subscribe']) {
      bob!.emit(attempt, STAFF_ROOM);
      bob!.emit(attempt, { room: STAFF_ROOM });
    }
    publishBookingEvent(BOOKING_EVENTS.created, booking());
    await settle(bob!);

    expect(eventsOf(bob!)).toHaveLength(0);
    const [serverSide] = (await io.fetchSockets()).filter((s) => s.id === bob!.id);
    expect(serverSide!.rooms.has(STAFF_ROOM)).toBe(false);
  });

  it('takes the role from the database, not from the token', async () => {
    // A customer whose token claims ADMIN
    const forged = jwt.sign({ userId: 'bob', email: 'bob@example.com', role: 'ADMIN' }, config.jwt.secret, { expiresIn: '1h' });
    const client = connectClient(url, { auth: { token: forged }, transports: ['websocket'], reconnection: false, forceNew: true });
    clients.push(client);
    received.set(client, []);
    client.onAny((event, data) => received.get(client)!.push({ event, data }));
    await new Promise<void>((resolve) => client.on('connect', resolve));
    clientsByUser.set(client, 'bob');

    publishBookingEvent(BOOKING_EVENTS.created, booking());
    await settle(client);

    expect(eventsOf(client)).toHaveLength(0);
  });

  it('never lets a failed emit break the caller', () => {
    const spy = vi.spyOn(socketService, 'emitToRooms').mockImplementation(() => {
      throw new Error('socket exploded');
    });

    try {
      expect(() => publishBookingEvent(BOOKING_EVENTS.created, booking())).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});
