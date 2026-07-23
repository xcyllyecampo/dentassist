import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import ClinicScene3D from '../components/ClinicScene3D';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { AlertTriangle } from 'lucide-react';

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
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/rooms'),
      api.get('/queue'),
    ]).then(([rms, q]) => {
      setRooms(rms.data);
      setQueue(q.data);
    }).catch(() => setError('Failed to load digital twin')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    socket.emit('join-twin');
    socket.emit('join-queue');

    const onRoomUpdate = ({ roomId, status }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
      setLastUpdate(new Date());
    };

    const onQueueUpdate = () => {
      api.get('/queue').then(res => {
        setQueue(res.data);
        setLastUpdate(new Date());
      });
    };

    socket.on('room-update', onRoomUpdate);
    socket.on('queue-update', onQueueUpdate);

    return () => {
      socket.off('room-update', onRoomUpdate);
      socket.off('queue-update', onQueueUpdate);
    };
  }, []);

  if (loading) return <Layout><Header title="Digital Twin — Live Clinic View" /><Spinner className="py-20" /></Layout>;
  if (error) return (
    <Layout>
      <Header title="Digital Twin — Live Clinic View" />
      <div className="p-6 flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="text-red-500" size={48} />
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-[#004aad] text-white rounded-lg hover:bg-[#003782] transition-colors text-sm">Retry</button>
      </div>
    </Layout>
  );

  const waiting = queue.filter(e => e.status === 'WAITING');
  const inProgress = queue.filter(e => e.status === 'IN_PROGRESS');

  return (
    <Layout>
      <Header title="Digital Twin — Live Clinic View" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Viewport */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-slate-900">Live — Real-time 3D View</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>

              <div className="h-[520px] bg-gradient-to-b from-[#f0f5ff] to-[#f0f5ff] relative">
                <ClinicScene3D
                  rooms={rooms}
                  queue={queue}
                  selectedRoom={selectedRoom}
                  onSelectRoom={setSelectedRoom}
                />
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 px-4 py-3 border-t border-slate-200 bg-gray-50">
                {Object.entries(ROOM_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600">{ROOM_LABELS[status]}</span>
                  </div>
                ))}
                <span className="text-[10px] text-gray-400 ml-auto">Click rooms for details • Drag to rotate • Scroll to zoom</span>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Live Queue */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Live Queue
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {waiting.length === 0 ? (
                  <p className="text-gray-400 text-xs">No patients waiting</p>
                ) : waiting.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <div className="w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {entry.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">{entry.patient?.user?.name}</div>
                      <div className="text-[10px] text-gray-500">~{entry.estimatedWait} min wait</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currently Serving */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                Currently Serving
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {inProgress.length === 0 ? (
                  <p className="text-gray-400 text-xs">No patients in service</p>
                ) : inProgress.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 bg-[#c2d5f7] text-[#002d6b] rounded-full flex items-center justify-center text-xs font-bold">
                      {entry.position}
                    </div>
                    <div className="text-xs font-medium text-slate-900 truncate">{entry.patient?.user?.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Room Status</h3>
              <div className="space-y-2">
                {Object.entries(ROOM_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-600">{ROOM_LABELS[status]}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {rooms.filter(r => r.status === status).length}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Total Rooms</span>
                  <span className="text-sm font-bold text-slate-900">{rooms.length}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-gray-500">Utilization</span>
                  <span className="text-sm font-bold text-slate-900">
                    {rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'OCCUPIED').length / rooms.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Queue Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Queue Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-amber-700">{waiting.length}</div>
                  <div className="text-[10px] text-amber-600">Waiting</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#003782]">{inProgress.length}</div>
                  <div className="text-[10px] text-[#004aad]">In Service</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Room Detail Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRoom(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ROOM_COLORS[selectedRoom.status] }} />
                <h2 className="text-lg font-bold text-slate-900">Room {selectedRoom.number} — {selectedRoom.name}</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm font-bold" style={{ color: ROOM_COLORS[selectedRoom.status] }}>
                    {ROOM_LABELS[selectedRoom.status]}
                  </span>
                </div>
                {selectedRoom.appointments?.length > 0 && (
                  <>
                    <div className="border-t border-gray-100 pt-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Current Appointment</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Patient</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].patient?.user?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Dentist</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].dentist?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Procedure</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].reason}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Time</span>
                      <span className="text-sm font-medium text-slate-900">{selectedRoom.appointments[0].time}</span>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setSelectedRoom(null)} className="w-full mt-6 bg-[#004aad] text-white py-2 rounded-lg text-sm hover:bg-[#003782] transition-colors">Close</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
