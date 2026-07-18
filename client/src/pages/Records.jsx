import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Activity, AlertTriangle } from 'lucide-react';

export default function Records() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    setError(null);
    api.get('/patients')
      .then(res => setPatients(res.data))
      .catch(() => setError('Failed to load patients'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = patients.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Header title="Digital Patient Records" />
      <div className="p-6">
        {loading && <Spinner className="py-20" />}
        {error && (
          <div className="text-center py-20">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchData} className="px-4 py-2 bg-[#004aad] text-white rounded-lg hover:bg-[#003782] text-sm font-medium">Retry</button>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search patient to view records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004aad] focus:outline-none"
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={Activity} title="No patients found" description="Try a different search or add patients" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p) => (
                  <div key={p.id}
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-[#6b9ae8] transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-[#c2d5f7] text-[#002d6b] rounded-full flex items-center justify-center font-bold text-lg">
                        {p.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{p.user?.name}</div>
                        <div className="text-xs text-gray-500">{p.user?.email}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div><Activity size={12} className="inline mr-1" /> Blood: {p.bloodType || 'N/A'}</div>
                      <div>Gender: {p.gender || 'N/A'}</div>
                      <div className="col-span-2">Allergies: <span className="text-red-600">{p.allergies || 'None'}</span></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-[#004aad] font-medium">
                      Click to view full records →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
