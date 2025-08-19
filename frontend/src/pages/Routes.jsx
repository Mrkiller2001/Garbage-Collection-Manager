import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import RoutePlanForm from '../components/RoutePlanForm';
import RoutePlansList from '../components/RoutePlansList';

export default function RoutesPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const headers = { Authorization: `Bearer ${user.token}` };

  const load = useCallback(async () => {
    try {
      setErr('');
      setLoading(true);
      const { data } = await axiosInstance.get('/api/routes', { headers });
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => { load(); }, [load]);

  const onCreated = () => load();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Pickup Routes</h1>
        <button onClick={load} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Refresh</button>
      </div>

      <RoutePlanForm onCreated={onCreated} />

      {loading && <div className="text-gray-500">Loading…</div>}
      {err && <div className="text-red-600 mb-3">Error: {err}</div>}

      {!loading && <RoutePlansList plans={plans} setPlans={setPlans} reload={load} />}
    </div>
  );
}
