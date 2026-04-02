import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { getUserId } from "../lib/api-client";

const SOCKET_URL = "http://localhost:3000";

type EventHandler = (...args: unknown[]) => void;

export function useSocket(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, EventHandler>>(new Map());

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(SOCKET_URL, {
      auth: { userId: getUserId() },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("session:join", sessionId);
    });

    handlersRef.current.forEach((handler, event) => {
      socket.on(event, handler);
    });

    return () => {
      socket.emit("session:leave", sessionId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const on = useCallback((event: string, handler: EventHandler) => {
    handlersRef.current.set(event, handler);
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string) => {
    const handler = handlersRef.current.get(event);
    if (handler) {
      socketRef.current?.off(event, handler);
      handlersRef.current.delete(event);
    }
  }, []);

  return { on, off };
}
