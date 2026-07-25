import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Tooltip from '../components/Tooltip';
import { SkeletonCard, SkeletonLine } from '../components/Skeleton';
import api, { authUrl } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { Plus, Clock, CheckCircle, XCircle, Phone, AlertTriangle, Stethoscope, Users } from 'lucide-react';
import { playCallPatient } from '../lib/sounds';

function QueueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 text-center w-24">
              <SkeletonLine width="3rem" height="1.5rem" className="mx-auto mb-1" />
              <SkeletonLine width="4rem" height="0.75rem" className="mx-auto" />
            </div>
          ))}
        </div>
        <SkeletonLine width="8rem" height="2rem" className="rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <SkeletonLine width="10rem" height="1rem" className="mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, j) => <SkeletonCard key={j} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Queue() {
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterDentistId, setFilterDentistId] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');

  const { data: queue = [], isLoading: loadingQueue, error: queueError } = useQuery({
    queryKey: ['queue'],
    queryFn: () => api.get('/queue').then(r => r.data),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then(r => r.data),
  });

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  });

  const dentists = dashboard?.dentists || [];
  const loading = loadingQueue;
  const error = queueError ? 'Failed to load queue' : null;

  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    };
    socket.on('queue-update', handler);
    return () => socket.off('queue-update', handler);
  }, [queryClient]);

  const isDentist = user?.role === 'DENTIST';
  const filteredQueue = filterDentistId === 'all'
    ? queue
    : queue.filter(e => e.dentistId === filterDentistId);

  const waiting = filteredQueue.filter(e => e.status === 'WAITING');
  const inProgress = filteredQueue.filter(e => e.status === 'IN_PROGRESS');

  const addMutation = useMutation({
    mutationFn: ({ patientId, dentistId }) => api.post('/queue', { patientId, dentistId: dentistId || undefined }).then(r => r.data),
    onMutate: async ({ patientId, dentistId }) => {
      await queryClient.cancelQueries({ queryKey: ['queue'] });
      const previous = queryClient.getQueryData(['queue']);
      const patient = patients.find(p => p.id === patientId);
      const optimistic = { id: `temp-${Date.now()}`, patientId, dentistId: dentistId || undefined, status: 'WAITING', position: (queue.length || 0) + 1, patient };
      queryClient.setQueryData(['queue'], (old) => [...(old || []), optimistic]);
      return { previous };
    },
    onError: (err, vars, ctx) => {
      queryClient.setQueryData(['queue'], ctx.previous);
      toast.error('Error adding to queue');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['queue'] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/queue/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      if (status === 'IN_PROGRESS') playCallPatient();
      await queryClient.cancelQueries({ queryKey: ['queue'] });
      const previous = queryClient.getQueryData(['queue']);
      if (status === 'IN_PROGRESS') {
        queryClient.setQueryData(['queue'], (old) => (old || []).map(e => e.id === id ? { ...e, status: 'IN_PROGRESS' } : e));
      } else {
        queryClient.setQueryData(['queue'], (old) => (old || []).filter(e => e.id !== id));
      }
      return { previous };
    },
    onError: (err, vars, ctx) => {
      queryClient.setQueryData(['queue'], ctx.previous);
      toast.error('Error updating queue');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['queue'] }),
  });

  const handleAdd = () => {
    if (!selectedPatient) return;
    addMutation.mutate({ patientId: selectedPatient, dentistId: filterDentistId }, {
      onSuccess: () => {
        setShowModal(false);
        setSelectedPatient('');
        toast.success('Patient added to queue');
      },
    });
  };

  return (
    <Layout>
      <Header title="Queue Management" />
      <div className="p-6">
        {loading && <QueueSkeleton />}
        {error && (
          <div className="text-center py-20">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ['queue'] })} className="px-4 py-2 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6D65] text-sm font-medium">Retry</button>
          </div>
        )}
        {!loading && !error && (
        <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-amber-600">{waiting.length}</div>
              <div className="text-xs text-amber-700">Waiting</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-[#0F766E]">{inProgress.length}</div>
              <div className="text-xs text-[#0D6D65]">In Progress</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-green-600">{queue.filter(e => e.status === 'COMPLETED').length}</div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#0F766E] text-white px-4 py-2 rounded-lg hover:bg-[#0D6D65] text-sm font-medium">
            <Plus size={16} /> Add to Queue
          </button>
        </div>

        {/* Dentist filter tabs */}
        {dentists.length > 0 && (
          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
            <button onClick={() => setFilterDentistId('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filterDentistId === 'all'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              <Users size={13} /> {isDentist ? 'My Patients' : 'All Dentists'}
            </button>
            {dentists.map(d => (
              <button key={d.id} onClick={() => setFilterDentistId(d.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filterDentistId === d.id
                    ? 'bg-[#0F766E] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                {d.avatar ? (
                  <img src={authUrl(d.avatar)} alt={d.name} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <Stethoscope size={13} />
                )}
                {d.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" /> Waiting Queue
            </h3>
            <div className="space-y-3">
              {waiting.length === 0 ? <p className="text-gray-400 text-sm">No patients waiting</p> :
                [...waiting].sort((a, b) => a.position - b.position).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center font-bold text-sm">
                          {entry.position}
                        </div>
                        {entry.patient?.user?.avatar ? (
                          <img src={authUrl(entry.patient.user.avatar)} alt={entry.patient.user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-200" />
                        ) : (
                          <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {entry.patient?.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{entry.patient?.user?.name}</div>
                        <div className="text-xs text-gray-500">
                          Est. wait: {entry.estimatedWait || '?'} min
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => statusMutation.mutate({ id: entry.id, status: 'IN_PROGRESS' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDFA] text-[#0D6D65] rounded-lg hover:bg-[#99F6E4] text-xs font-semibold uppercase tracking-wide">
                        <Phone size={12} /> Call Patient
                      </button>
                      <Tooltip content="Cancel">
                        <button onClick={() => statusMutation.mutate({ id: entry.id, status: 'CANCELLED' })}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                          <XCircle size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Phone size={18} className="text-[#0F766E]" /> In Progress
            </h3>
            <div className="space-y-3">
              {inProgress.length === 0 ? <p className="text-gray-400 text-sm">No patients in progress</p> :
                inProgress.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        {entry.patient?.user?.avatar ? (
                          <img src={authUrl(entry.patient.user.avatar)} alt={entry.patient.user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200" />
                        ) : (
                          <div className="w-10 h-10 bg-[#99F6E4] text-[#064E3B] rounded-full flex items-center justify-center text-sm font-bold">
                            {entry.patient?.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{entry.patient?.user?.name}</div>
                          <div className="text-xs text-gray-500">Position #{entry.position}</div>
                        </div>
                      </div>
                    <div className="flex gap-2">
                      <Tooltip content="Complete">
                        <button onClick={() => statusMutation.mutate({ id: entry.id, status: 'COMPLETED' })}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                          <CheckCircle size={14} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Cancel">
                        <button onClick={() => statusMutation.mutate({ id: entry.id, status: 'CANCELLED' })}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                          <XCircle size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
        </>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Add Patient to Queue</h2>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm mb-3 focus:ring-2 focus:ring-[#0F766E] focus:outline-none ${selectedPatient === '' ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
              </select>
              {selectedPatient === '' && <p className="text-xs text-red-500 -mt-1 mb-3">Please select a patient</p>}
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Dentist</label>
              <select value={filterDentistId !== 'all' ? filterDentistId : ''} onChange={e => {}}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 bg-slate-50 text-gray-500 cursor-not-allowed"
                disabled>
                <option value="">{filterDentistId !== 'all' ? dentists.find(d => d.id === filterDentistId)?.name || 'Selected Dentist' : 'Auto-assign'}</option>
              </select>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button onClick={handleAdd} disabled={!selectedPatient} className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${selectedPatient ? 'bg-[#0F766E] hover:bg-[#0D6D65]' : 'bg-gray-300 cursor-not-allowed'}`}>Add to Queue</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
