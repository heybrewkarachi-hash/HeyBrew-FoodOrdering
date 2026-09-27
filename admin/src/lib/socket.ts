"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE } from "./api";

let socket: Socket | null = null;

export function getAdminSocket(): Socket {
  if (socket) return socket;
  socket = io(API_BASE, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectAdminSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
