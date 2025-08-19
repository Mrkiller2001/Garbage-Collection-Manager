import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

export default function BinHistoryPage() {
  const { id: binId } = useParams();
  const { user } = useAuth();

  const [bin, setBin] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const headers = useMemo(() => ({ Authorization: `Bearer ${user.token}` }), [user.token]);

  const load = useCallback(async () => {
    try {
      setErr('');
      setLoading(true);
      const [binRes, histRes] = await Promise.all([
        axiosInstance.get(`/api/bins/${binId}`, { headers }),
        axiosInstance.get(`/api/sensor-readings/bin/${binId}`, { headers })
      ]);
      setBin(binRes.data);
      // normalize for chart
      const rows = (histRes.data || []).map(r => ({
        ...r,
        takenAtLabel: new Date(r.takenAt).toLocaleString(),
      }));
      setReadings(rows);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [binId, headers]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    if (!readings.length) return null;
    const fills = readings.map(r => r.fillPct);
    const avg = Math.round(fills.reduce((a, b) => a + b, 0) / fills.length);
    const latest = readings[0];
    return { avgFill: avg, latestFill: latest.fillPct, latestAt: latest.takenAt };
  }, [readings]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Bin History</h1>
          <p className="text-gray-600 text-sm">
            {bin ? (<>
              <span className="font-medium">{bin.name}</span> · {bin.type} · {bin.capacityLitres}L
            </>) : 'Loading…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/bins" className="px-3 py-2 border rounded">Back to Bins</Link>
          <button onClick={load} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Refresh</button>
        </div>
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
      {err && <div className="text-red-600 mb-3">Error: {err}</div>}

      {!loading && !!bin && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Stat label="Latest Fill" value={stats?.latestFill != null ? `${stats.latestFill}%` : '-'} />
            <Stat label="Average Fill" value={stats?.avgFill != null ? `${stats.avgFill}%` : '-'} />
            <Stat label="Last Reading" value={stats?.latestAt ? new Date(stats.latestAt).toLocaleString() : '-'} />
          </div>

          {/* Chart */}
          <div className="bg-white shadow rounded p-3 mb-6">
            <div className="text-sm text-gray-600 mb-2">Fill% over time</div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={[...readings].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="takenAtLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="fillPct" name="Fill %" dot={false} />
                  <Line type="monotone" dataKey="batteryPct" name="Battery %" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-left">
                  <th className="px-4 py-2">Taken At</th>
                  <th className="px-4 py-2">Fill %</th>
                  <th className="px-4 py-2">Battery %</th>
                </tr>
              </thead>
              <tbody>
                {readings.map(r => (
                  <tr key={r._id} className="border-t">
                    <td className="px-4 py-2">{new Date(r.takenAt).toLocaleString()}</td>
                    <td className="px-4 py-2">{r.fillPct}%</td>
                    <td className="px-4 py-2">{r.batteryPct ?? '-'}</td>
                  </tr>
                ))}
                {!readings.length && (
                  <tr>
                    <td colSpan="3" className="px-4 py-6 text-center text-gray-500">No readings yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white shadow rounded p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
