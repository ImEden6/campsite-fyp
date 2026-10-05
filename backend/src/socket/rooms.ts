// Socket.IO rooms
//
// Rooms are the only way events reach clients. Membership is decided here, on the server,
// from the authenticated user; clients cannot join or choose rooms.
//
//   user:{id}  every connection of that user (their own bookings, payments, notifications)
//   staff      all staff, managers and admins (operational events for the whole campsite)

export const STAFF_ROOM = 'staff';

const STAFF_ROLES: readonly string[] = ['STAFF', 'MANAGER', 'ADMIN'];

export const userRoom = (userId: string): string => `user:${userId}`;

export const roomsFor = (user: { id: string; role: string }): string[] => [
  userRoom(user.id),
  ...(STAFF_ROLES.includes(user.role) ? [STAFF_ROOM] : []),
];
