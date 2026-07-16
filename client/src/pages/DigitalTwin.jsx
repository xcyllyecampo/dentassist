import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { io } from 'socket.io-client';

const ROOM_COLORS = {
  AVAILABLE: '#10b981',
  OCCUPIED: '#ef4444',
  CLEANING: '#3b82f6',
  MAINTENANCE: '#f59e0b',
};

const ROOM_LABELS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
};

export default function DigitalTwin() {
  const [rooms, setRooms] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/rooms'),
      api.get('/queue'),
    ]).then(([rms, q]) => {
      setRooms(rms.data);
      setQueue(q.data);
    });

    const socket = io(window.location.origin, { path: '/socket.io' });
    socketRef.current = socket;
    socket.emit('join-twin');
    socket.emit('join-queue');

    socket.on('room-update', ({ roomId, status }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
    });

    socket.on('queue-update', (data) => {
      if (data.waitingCount !== undefined) {
        api.get('/queue').then(res => setQueue(res.data));
      }
    });

    return () => socket.disconnect();
  }, []);

  const waiting = queue.filter(e => e.status === 'WAITING');
  const inProgress = queue.filter(e => e.status === 'IN_PROGRESS');

  return (
    <Layout>
      <Header title="Digital Twin — Clinic Overview" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
              <h3 className="font-bold text-sky-900 mb-6">Clinic Floor Plan</h3>

              <div className="relative bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl p-8 min-h-[400px]">
                {/* Reception */}
                <div className="absolute top-4 left-4 right-4 h-16 bg-sky-100 border-2 border-sky-300 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-bold text-sky-900">Reception</div>
                    <div className="text-xs text-sky-600">Queue: {waiting.length} waiting</div>
                  </div>
                </div>

                {/* Waiting Area */}
                <div className="absolute top-28 left-4 right-4 h-20 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-bold text-amber-800">Waiting Area</div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {waiting.slice(0, 5).map((entry, i) => (
                        <div key={entry.id} className="w-8 h-8 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                          {entry.patient?.user?.name?.charAt(0)}
                        </div>
                      ))}
                      {waiting.length > 5 && <span className="text-xs text-amber-600">+{waiting.length - 5}</span>}
                      {waiting.length === 0 && <span className="text-xs text-gray-400">Empty</span>}
                    </div>
                  </div>
                </div>

                {/* Rooms Grid */}
                <div className="absolute top-56 left-4 right-4 bottom-4 grid grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className="rounded-xl border-2 p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg flex flex-col items-center justify-center"
                      style={{
                        borderColor: ROOM_COLORS[room.status],
                        backgroundColor: ROOM_COLORS[room.status] + '15',
                      }}>
                      <div className="text-xs font-medium mb-1" style={{ color: ROOM_COLORS[room.status] }}>
                        Room {room.number}
                      </div>
                      <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: ROOM_COLORS[room.status] }} />
                      <div className="text-xs font-bold" style={{ color: ROOM_COLORS[room.status] }}>
                        {ROOM_LABELS[room.status]}
                      </div>
                      {room.appointments?.length > 0 && (
                        <div className="text-[10px] text-gray-600 mt-1 text-center">
                          <div>{room.appointments[0].patient?.user?.name}</div>
                          <div>{room.appointments[0].dentist?.name}</div>
                          <div>{room.appointments[0].reason}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4">
                {Object.entries(ROOM_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600">{ROOM_LABELS[status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-4">
              <h3 className="font-bold text-sky-900 text-sm mb-3">Live Queue</h3>
              <div className="space-y-2">
                {waiting.length === 0 ? (
                  <p className="text-gray-400 text-xs">No one waiting</p>
                ) : waiting.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <div className="w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {entry.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-sky-900 truncate">{entry.patient?.user?.name}</div>
                      <div className="text-[10px] text-gray-500">~{entry.estimatedWait} min wait</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-4">
              <h3 className="font-bold text-sky-900 text-sm mb-3">Currently Serving</h3>
              <div className="space-y-2">
                {inProgress.length === 0 ? (
                  <p className="text-gray-400 text-xs">None</p>
                ) : inProgress.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg">
                    <div className="w-6 h-6 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {entry.position}
                    </div>
                    <div className="text-xs font-medium text-sky-900 truncate">{entry.patient?.user?.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-4">
              <h3 className="font-bold text-sky-900 text-sm mb-3">Room Status Summary</h3>
              <div className="space-y-2">
                {Object.entries(ROOM_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-600">{ROOM_LABELS[status]}</span>
                    </div>
                    <span className="text-xs font-bold text-sky-900">
                      {rooms.filter(r => r.status === status).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {selectedRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRoom(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-sky-900 mb-4">Room {selectedRoom.number} — {selectedRoom.name}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm font-bold" style={{ color: ROOM_COLORS[selectedRoom.status] }}>
                    {ROOM_LABELS[selectedRoom.status]}
                  </span>
                </div>
                {selectedRoom.appointments?.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Patient</span>
                      <span className="text-sm font-medium text-sky-900">{selectedRoom.appointments[0].patient?.user?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Dentist</span>
                      <span className="text-sm font-medium text-sky-900">{selectedRoom.appointments[0].dentist?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Procedure</span>
                      <span className="text-sm font-medium text-sky-900">{selectedRoom.appointments[0].reason}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Time</span>
                      <span className="text-sm font-medium text-sky-900">{selectedRoom.appointments[0].time}</span>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedRoom(null)} className="w-full mt-6 bg-sky-600 text-white py-2 rounded-lg text-sm hover:bg-sky-700">Close</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
