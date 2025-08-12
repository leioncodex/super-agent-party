import { useEffect, useRef, useState, useCallback } from 'react';

export function useAvatar3D() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/vrm`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    return () => {
      ws.close();
    };
  }, []);

  const speak = useCallback((text: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'tts', text }));
  }, []);

  const gesture = useCallback((name: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'gesture', name }));
  }, []);

  return { connected, speak, gesture };
}
