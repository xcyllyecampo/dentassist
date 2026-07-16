import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import api from '../lib/api';
import { Plus, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');

  useEffect(() => {
    api.get('/queue').then(res => setQueue(res.data));
    api.get('/patients').then(res => setPatients(res.data));
  }, []);

  const handleAdd = async () => {
    if (!selectedPatient) return;
    try {
      const res = await api.post('/queue', { patientId: selectedPatient });
      setQueue([...queue, res.data]);
      setShowModal(false);
      setSelectedPatient('');
    } catch (err) { alert('Error adding to queue'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/queue/${id}`, { status });
      setQueue(queue.filter(e => e.id !== id));
    } catch (err) { alert('Error updating queue'); }
  };

  const waiting = queue.filter(e => e.status === 'WAITING');
  const inProgress = queue.filter(e => e.status === 'IN_PROGRESS');

  return (
    <Layout>
      <Header title="Queue Management" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-amber-600">{waiting.length}</div>
              <div className="text-xs text-amber-700">Waiting</div>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-sky-600">{inProgress.length}</div>
              <div className="text-xs text-sky-700">In Progress</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
              <div className="text-2xl font-bold text-green-600">{queue.filter(e => e.status === 'COMPLETED').length}</div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 text-sm font-medium">
            <Plus size={16} /> Add to Queue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
            <h3 className="font-bold text-sky-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" /> Waiting Queue
            </h3>
            <div className="space-y-3">
              {waiting.length === 0 ? <p className="text-gray-400 text-sm">No one in queue</p> :
                waiting.sort((a, b) => a.position - b.position).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center font-bold text-lg">
                        {entry.position}
                      </div>
                      <div>
                        <div className="font-medium text-sky-900">{entry.patient?.user?.name}</div>
                        <div className="text-xs text-gray-500">
                          Est. wait: {entry.estimatedWait || '?'} min
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusUpdate(entry.id, 'IN_PROGRESS')}
                        className="p-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200" title="Call patient">
                        <Loader size={14} />
                      </button>
                      <button onClick={() => handleStatusUpdate(entry.id, 'CANCELLED')}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Cancel">
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-6">
            <h3 className="font-bold text-sky-900 mb-4 flex items-center gap-2">
              <Loader size={18} className="text-sky-500" /> In Progress
            </h3>
            <div className="space-y-3">
              {inProgress.length === 0 ? <p className="text-gray-400 text-sm">No patients in progress</p> :
                inProgress.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-sky-50 rounded-lg border border-sky-100">
                    <div>
                      <div className="font-medium text-sky-900">{entry.patient?.user?.name}</div>
                      <div className="text-xs text-gray-500">Position #{entry.position}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusUpdate(entry.id, 'COMPLETED')}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Complete">
                        <CheckCircle size={14} />
                      </button>
                      <button onClick={() => handleStatusUpdate(entry.id, 'CANCELLED')}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Cancel">
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-sky-900 mb-4">Add Patient to Queue</h2>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
                className="w-full px-3 py-2 border border-sky-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-sky-400 focus:outline-none">
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.user?.name}</option>)}
              </select>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button onClick={handleAdd} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-medium">Add to Queue</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
