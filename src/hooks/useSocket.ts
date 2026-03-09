/**
 * useSocket — Socket.io client hook
 *
 * Creates (or reuses) a Socket.io connection to the TON-Eats backend.
 * Returns the socket instance and a `connected` boolean.
 *
 * Usage:
 *   const { socket, connected } = useSocket();
 *   socket.emit('join:order', { orderId });
 *   socket.on('courier:location', ({lat, lng}) => ...);
 */

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// If running locally in Vite dev mode, backend is at 3001.
// Otherwise (Docker / Tunnel / Prod), Nginx proxies /api and /socket.io from the same origin!
const isLocalDev = window.location.port === "5173" || window.location.port === "4173";
const BASE = import.meta.env.VITE_BACKEND_URL || (isLocalDev ? "http://localhost:3001" : window.location.origin);


// Singleton socket — survives React strict-mode double-mount
let _socket: Socket | null = null;

export function useSocket() {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!_socket) {
            _socket = io(BASE, {
                transports: ["websocket", "polling"],
                reconnectionAttempts: 10,
                reconnectionDelay: 1500,
            });
        }

        socketRef.current = _socket;

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        _socket.on("connect", onConnect);
        _socket.on("disconnect", onDisconnect);

        if (_socket.connected) setConnected(true);

        return () => {
            _socket?.off("connect", onConnect);
            _socket?.off("disconnect", onDisconnect);
        };
    }, []);

    return { socket: socketRef.current ?? _socket, connected };
}
