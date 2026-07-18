import { useState, useEffect, useRef } from 'react';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { io } from 'socket.io-client';
import { Clock, Users, Loader, AlertTriangle } from 'lucide-react';

export default function KioskQueueStatus() {
  const [myEntry, setMyEntry] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [servingCount, setServingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const fetchMyEntry = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/queue/my-entry'),
      api.get('/queue'),
    ]).then(([myRes, queueRes]) => {
      setMyEntry(myRes.data || null);
      const entries = queueRes.data || [];
      setWaitingCount(entries.filter(e => e.status === 'WAITING').length);
      setServingCount(entries.filter(e => e.status === 'IN_PROGRESS').length);
    }).catch(() => setError('Failed to load queue status'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyEntry();

    const socket = io(window.location.origin, { path: '/socket.io' });
    socketRef.current = socket;
    socket.emit('join-queue');

    socket.on('queue-update', () => {
      fetchMyEntry();
    });

    return () => socket.disconnect();
  }, []);

  const positionProgress = myEntry && myEntry.position > 0
    ? Math.max(0, 100 - (myEntry.position * 15))
    : 0;

  return (
    <KioskLayout title="My Queue Status">
      <div className="flex flex-col items-center py-6">
        {loading && (
          <div className="flex items-center gap-3 text-white/60">
            <Loader size={24} className="animate-spin" />
            <span>Loading queue status...</span>
          </div>
        )}

        {error && (
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchMyEntry} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !myEntry && (
          <div className="text-center">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center mb-8 border border-white/20 mx-auto">
              <Clock size={48} className="text-white/40" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Not in Queue</h2>
            <p className="text-white/60 text-lg mb-8">You haven't checked in yet.</p>
            <a href="/kiosk/check-in" className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">
              Check In Now
            </a>
          </div>
        )}

        {!loading && !error && myEntry && (
          <>
            {/* My position card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 w-full mb-6">
              <div className="text-center mb-6">
                <div className="text-white/50 text-sm uppercase tracking-wider mb-2">Your Position</div>
                <div className="text-6xl font-bold text-white mb-2">#{myEntry.position}</div>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                  myEntry.status === 'WAITING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-green-500/20 text-green-300 border border-green-500/40'
                }`}>
                  {myEntry.status === 'WAITING' ? <Clock size={14} /> : <Loader size={14} className="animate-spin" />}
                  {myEntry.status === 'WAITING' ? 'Waiting' : 'Now Serving'}
                </div>
              </div>

              {myEntry.status === 'WAITING' && (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Queue Progress</span>
                      <span>~{myEntry.estimatedWait || '?'} min wait</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: `${positionProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center text-white/50 text-sm">
                    Please remain in the waiting area. You will be called when it's your turn.
                  </div>
                </>
              )}

              {myEntry.status === 'IN_PROGRESS' && (
                <div className="text-center text-green-300 font-medium text-lg">
                  A staff member will be with you shortly!
                </div>
              )}
            </div>

            {/* Queue stats */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-5 text-center">
                <Users size={24} className="text-amber-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{waitingCount}</div>
                <div className="text-white/50 text-sm">Waiting</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-5 text-center">
                <Loader size={24} className="text-green-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{servingCount}</div>
                <div className="text-white/50 text-sm">Now Serving</div>
              </div>
            </div>
          </>
        )}
      </div>
    </KioskLayout>
  );
}
