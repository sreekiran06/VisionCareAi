import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectionStatus } from "../types";

interface UseWebSocketReturn {
  sendMessage: (data: string) => void;
  lastMessage: MessageEvent | null;
  connectionStatus: ConnectionStatus;
}

const INITIAL_DELAY_MS = 500;       // wait briefly before first connect attempt
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 15000;

/**
 * Wraps a native WebSocket with auto-reconnect (exponential backoff)
 * and exposes the last received message plus connection status.
 * Uses a short initial delay to avoid "closed before connection established"
 * errors from React StrictMode's double-invoke of effects.
 */
export function useWebSocket(url: string): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    // Don't open a new connection if we're already open or connecting
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setConnectionStatus("connecting");
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      // Invalid URL or browser blocked – schedule a retry
      const delay = Math.min(
        RECONNECT_DELAY_MS * 2 ** reconnectAttempts.current,
        MAX_RECONNECT_DELAY_MS
      );
      reconnectAttempts.current += 1;
      if (shouldReconnect.current) {
        reconnectTimer.current = setTimeout(connect, delay);
      }
      return;
    }
    wsRef.current = socket;

    socket.onopen = () => {
      reconnectAttempts.current = 0;
      setConnectionStatus("connected");
    };

    socket.onmessage = (event: MessageEvent) => {
      setLastMessage(event);
    };

    socket.onclose = () => {
      setConnectionStatus("disconnected");
      if (shouldReconnect.current) {
        const delay = Math.min(
          RECONNECT_DELAY_MS * 2 ** reconnectAttempts.current,
          MAX_RECONNECT_DELAY_MS
        );
        reconnectAttempts.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    socket.onerror = () => {
      // onclose will fire after onerror, triggering reconnect logic there
      if (socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
    };
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;

    // Small initial delay avoids React StrictMode double-effect race
    reconnectTimer.current = setTimeout(connect, INITIAL_DELAY_MS);

    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const ws = wsRef.current;
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  return { sendMessage, lastMessage, connectionStatus };
}
