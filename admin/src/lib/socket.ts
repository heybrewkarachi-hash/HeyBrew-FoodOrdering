"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE } from "./api";

let socket: Socket | null = null;
let refCount = 0;

export function getAdminSocket(): Socket {
  if (socket) return socket;
  socket = io(SOCKET_BASE, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
  return socket;
}

/** Acquire a shared admin socket (refcount). Pair with releaseAdminSocket. */
export function acquireAdminSocket(): Socket {
  refCount += 1;
  return getAdminSocket();
}

export function releaseAdminSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    disconnectAdminSocket();
  }
}

export function disconnectAdminSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  refCount = 0;
}
