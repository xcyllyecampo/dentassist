import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';
import api from '../lib/api';
import { playNotification } from '../lib/sounds';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const isLocalId = (id) => typeof id === 'string' && id.startsWith('local_');

  const unreadList = useMemo(() => notifications.filter(n => !n.read), [notifications]);

  const counts = useMemo(() => ({
    appointment: unreadList.filter(n => n.type === 'appointment').length,
    queue: unreadList.filter(n => n.type === 'queue').length,
    patient: unreadList.filter(n => n.type === 'patient').length,
    room: unreadList.filter(n => n.type === 'room').length,
  }), [unreadList]);

  const unreadCount = useMemo(() =>
    counts.appointment + counts.queue + counts.patient + counts.room,
  [counts]);

  const addNotification = useCallback((type, message) => {
    const id = 'local_' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    setNotifications(prev => [{ id, type, message, timestamp: new Date(), read: false }, ...prev].slice(0, 50));
    playNotification();
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (!isLocalId(id)) {
      try { await api.put(`/notifications/${id}/read`); } catch {}
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.put('/notifications/read-all'); } catch {}
  }, []);

  const pushFromServer = useCallback((serverNotifs) => {
    if (!serverNotifs || serverNotifs.length === 0) return;
    const newNotifs = serverNotifs.map(n => ({
      id: n.id,
      type: n.type,
      message: n.message,
      timestamp: new Date(n.createdAt),
      read: n.read,
    }));
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const merged = [...newNotifs.filter(n => !existingIds.has(n.id)), ...prev];
      return merged.slice(0, 50);
    });
  }, []);

  useEffect(() => {
    if (!user || user.role === 'PATIENT') return;

    const socket = getSocket();

    const onConnect = () => {
      socket.emit('join-notifications');
    };

    const onNotification = (data) => {
      addNotification(data.type, data.message);
    };

    if (socket.connected) {
      socket.emit('join-notifications');
    }
    socket.on('connect', onConnect);
    socket.on('notification', onNotification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('notification', onNotification);
    };
  }, [user, addNotification]);

  useEffect(() => {
    if (!user || user.role === 'PATIENT') return;
    api.get('/notifications')
      .then(res => pushFromServer(res.data))
      .catch(() => {});
  }, [user, pushFromServer]);

  return (
    <NotificationContext.Provider value={{ notifications, counts, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
