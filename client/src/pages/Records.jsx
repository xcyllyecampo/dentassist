import { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Activity } from 'lucide-react';

export default function Records() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useState(() => {
    api.get('/patients').then(res => setPatients(res.data));
  }, []);

  const filtered = patients.filter(p =>
    p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Header title="Digital Patient Records" />
      <div className="p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search patient to view records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-sky-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id}
              onClick={() => navigate(`/patients/${p.id}`)}
              className="bg-white rounded-xl shadow-sm border border-sky-100 p-5 cursor-pointer hover:shadow-md hover:border-sky-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-sky-200 text-sky-800 rounded-full flex items-center justify-center font-bold text-lg">
                  {p.user?.name?.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sky-900">{p.user?.name}</div>
                  <div className="text-xs text-gray-500">{p.user?.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div><Activity size={12} className="inline mr-1" /> Blood: {p.bloodType || 'N/A'}</div>
                <div>Gender: {p.gender || 'N/A'}</div>
                <div className="col-span-2">Allergies: <span className="text-red-600">{p.allergies || 'None'}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-sky-50 text-xs text-sky-600 font-medium">
                Click to view full records →
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
