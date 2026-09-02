import { useState, useEffect, useRef, useCallback } from 'react';

type WsEvent = {
  type: string;
  payload: Record<string, unknown>;
};

type WsOptions = {
  onMessage?: (event: WsEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

const WS_BASE = process.env.REACT_APP_WS_URL ?? 'ws://localhost:8000';

export function useAdminWebSocket(options: WsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const token = localStorage.getItem('vc_access_token');
    const url = `${WS_BASE}/ws/admin${token ? `?token=${token}` : ''}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        options.onConnect?.();
      };

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const event: WsEvent = JSON.parse(e.data);
          setLastEvent(event);
          options.onMessage?.(event);
        } catch {/* ignore parse errors */}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        options.onDisconnect?.();
        // Auto-reconnect after 5s
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, lastEvent, send };
}
