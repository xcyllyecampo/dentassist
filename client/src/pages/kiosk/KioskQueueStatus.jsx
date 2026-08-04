import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import KioskLayout from './KioskLayout';
import api from '../../lib/api';
import { playClick, playCallPatient } from '../../lib/sounds';
import { getSocket } from '../../lib/socket';
import { Clock, Users, Loader, AlertTriangle } from 'lucide-react';

function KioskQueueSkeleton() {
  return (
    <KioskLayout title="My Queue Status">
      <div className="flex flex-col items-center py-6">
        <div className="kiosk-card p-6 w-full mb-6">
          <div className="text-center mb-6">
            <div className="h-3 bg-white/10 rounded animate-pulse w-32 mx-auto mb-3" />
            <div className="h-16 bg-white/10 rounded animate-pulse w-24 mx-auto mb-3" />
            <div className="h-6 bg-white/10 rounded-full animate-pulse w-28 mx-auto" />
          </div>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <div className="h-3 bg-white/10 rounded animate-pulse w-24" />
              <div className="h-3 bg-white/10 rounded animate-pulse w-20" />
            </div>
            <div className="h-3 bg-white/10 rounded-full animate-pulse w-full" />
          </div>
          <div className="h-3 bg-white/10 rounded animate-pulse w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="kiosk-card p-5 text-center">
            <div className="h-6 bg-white/10 rounded animate-pulse w-6 mx-auto mb-2" />
            <div className="h-8 bg-white/10 rounded animate-pulse w-12 mx-auto mb-2" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-16 mx-auto" />
          </div>
          <div className="kiosk-card p-5 text-center">
            <div className="h-6 bg-white/10 rounded animate-pulse w-6 mx-auto mb-2" />
            <div className="h-8 bg-white/10 rounded animate-pulse w-12 mx-auto mb-2" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-20 mx-auto" />
          </div>
        </div>
      </div>
    </KioskLayout>
  );
}

export default function KioskQueueStatus() {
  const queryClient = useQueryClient();
  const prevStatusRef = useRef(null);

  const { data: myEntry, isLoading: loadingMy, error: errorMy, refetch: refetchMy } = useQuery({
    queryKey: ['kiosk-queue-entry'],
    queryFn: () => api.get('/queue/my-entry').then(r => r.data || null),
    refetchInterval: 5000,
  });

  const { data: queueEntries, isLoading: loadingQueue } = useQuery({
    queryKey: ['kiosk-queue'],
    queryFn: () => api.get('/queue').then(r => r.data || []),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (myEntry) {
      if (prevStatusRef.current === 'WAITING' && myEntry.status === 'IN_PROGRESS') {
        playCallPatient();
      }
      prevStatusRef.current = myEntry.status || null;
    }
  }, [myEntry]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join-queue');

    const onQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['kiosk-queue-entry'] });
      queryClient.invalidateQueries({ queryKey: ['kiosk-queue'] });
    };

    socket.on('queue-update', onQueueUpdate);

    return () => {
      socket.off('queue-update', onQueueUpdate);
    };
  }, [queryClient]);

  const loading = loadingMy || loadingQueue;
  const error = errorMy;
  const waitingCount = queueEntries?.filter(e => e.status === 'WAITING').length || 0;
  const servingCount = queueEntries?.filter(e => e.status === 'IN_PROGRESS').length || 0;

  const positionProgress = myEntry && (myEntry.effectivePosition ?? myEntry.position) > 0
    ? Math.max(0, 100 - ((myEntry.effectivePosition ?? myEntry.position) * 15))
    : 0;

  if (loading) return <KioskQueueSkeleton />;

  return (
    <KioskLayout title="My Queue Status">
      <div className="flex flex-col items-center py-6">
        {error && (
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-red-400 mb-4">Failed to load queue status</p>
            <button onClick={() => { playClick(); refetchMy(); }} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
              Retry
            </button>
          </div>
        )}

        {!error && !myEntry && (
          <div className="text-center">
            <div className="w-24 h-24 kiosk-card flex items-center justify-center mb-8 mx-auto">
              <Clock size={48} className="text-white/40" />
            </div>
            <h2 className="kiosk-display text-3xl text-white mb-3">Not in Queue</h2>
            <p className="text-white/60 text-lg mb-8">You haven't checked in yet.</p>
            <a href="/kiosk/check-in" onClick={() => playClick()} className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl font-bold text-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/30">
              Check In Now
            </a>
          </div>
        )}

        {!error && myEntry && (
          <>
            {/* My position card */}
            <div className="kiosk-card p-6 w-full mb-6">
              <div className="text-center mb-6">
                <div className="text-white/50 text-sm uppercase tracking-wider mb-2">Your Position</div>
                <div className="kiosk-display text-6xl text-white mb-2">#{myEntry.effectivePosition ?? myEntry.position}</div>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${
                  myEntry.status === 'WAITING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-green-500/20 text-green-300 border border-green-500/40'
                }`}>
                  {myEntry.status === 'WAITING' ? <Clock size={14} /> : <Loader size={14} className="animate-spin" />}
                  {myEntry.status === 'WAITING' ? 'Waiting' : 'Now Serving'}
                </div>
                {myEntry.isPlatinum && (
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                    ⚡ Platinum Priority — you jump ahead of the regular line
                  </div>
                )}
              </div>

              {myEntry.status === 'WAITING' && (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Queue Progress</span>
                      <span>~{myEntry.estimatedWait || '?'} min wait</span>
                    </div>
                    <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
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
              <div className="kiosk-card p-5 text-center">
                <Users size={24} className="text-amber-400 mx-auto mb-2" />
                <div className="kiosk-display text-3xl text-white">{waitingCount}</div>
                <div className="text-white/50 text-sm">Waiting</div>
              </div>
              <div className="kiosk-card p-5 text-center">
                <Loader size={24} className="text-green-400 mx-auto mb-2" />
                <div className="kiosk-display text-3xl text-white">{servingCount}</div>
                <div className="text-white/50 text-sm">Now Serving</div>
              </div>
            </div>
          </>
        )}
      </div>
    </KioskLayout>
  );
}
