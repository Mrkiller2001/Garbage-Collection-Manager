import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

export default function RoutePlanDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setErr('');
        setLoading(true);
        const { data } = await axiosInstance.get(`/api/routes/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setPlan(data);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || 'Failed to load route plan');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user.token]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Route Plan</h1>
          {plan && (
            <p className="text-gray-600 text-sm">
              Created: {new Date(plan.createdAt).toLocaleString()} · Stops: {plan.stops?.length ?? 0} · Total: {(plan.totalDistanceKm ?? 0).toFixed?.(3) ?? plan.totalDistanceKm} km
            </p>
          )}
        </div>
        <Link to="/routes" className="px-3 py-2 border rounded">Back to Routes</Link>
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
      {err && <div className="text-red-600 mb-3">Error: {err}</div>}

      {plan && (
        <>
          <div className="bg-white rounded shadow p-3 mb-4">
            <div className="text-sm text-gray-600">Depot</div>
            <div className="text-sm">
              lat: {plan.depot?.lat}, lng: {plan.depot?.lng}
            </div>
            <div className="text-sm text-gray-600 mt-2">Config</div>
            <div className="text-sm">Threshold: {plan.threshold}% {plan.maxStops ? `· Max Stops: ${plan.maxStops}` : ''}</div>
          </div>

          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-left">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Bin</th>
                  <th className="px-4 py-2">Lat</th>
                  <th className="px-4 py-2">Lng</th>
                  <th className="px-4 py-2">Dist from prev (km)</th>
                </tr>
              </thead>
              <tbody>
                {plan.stops?.map((s, idx) => (
                  <tr key={`${s.binId}-${idx}`} className="border-t">
                    <td className="px-4 py-2">{idx + 1}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.location?.lat}</td>
                    <td className="px-4 py-2">{s.location?.lng}</td>
                    <td className="px-4 py-2">{(s.distanceFromPrevKm ?? 0).toFixed?.(3) ?? s.distanceFromPrevKm}</td>
                  </tr>
                ))}
                {!plan.stops?.length && (
                  <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No stops in this plan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Total distance includes return to depot.
          </p>
        </>
      )}
    </div>
  );
}
