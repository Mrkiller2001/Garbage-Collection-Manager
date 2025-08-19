import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import FillBadge from './FillBadge';
import { Link } from 'react-router-dom';

export default function BinList({ bins, setBins, setEditingBin }) {
  const { user } = useAuth();

  const remove = async (id) => {
    if (!window.confirm('Delete this bin?')) return;
    try {
      await axiosInstance.delete(`/api/bins/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setBins((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

const simulateFill = async (b, value = 85) => {
  try {
    await axiosInstance.post('/api/sensor-readings', {
      binId: b._id,
      fillPct: value,
      batteryPct: 60
    }, { headers: { Authorization: `Bearer ${user.token}` } });

    // Update the row locally so you see it immediately
    setBins(prev => prev.map(x => x._id === b._id
      ? { ...x, latestFillPct: value, status: value >= 80 ? 'needs_pickup' : 'normal', latestReadingAt: new Date().toISOString() }
      : x
    ));
  } catch (e) {
    alert(e?.response?.data?.message || e.message || 'Failed to add reading');
  }
};


  return (
    <div className="overflow-x-auto bg-white shadow rounded">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr className="text-left text-sm text-gray-600">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Capacity (L)</th>
            <th className="px-4 py-3">Fill</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last Reading</th>
            <th className="px-4 py-3 w-50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((b) => (
            <tr key={b._id} className="border-t text-sm">
              <td className="px-4 py-3">{b.name}</td>
              <td className="px-4 py-3 capitalize">{b.type}</td>
              <td className="px-4 py-3">{b.capacityLitres}</td>
              <td className="px-4 py-3">
                <FillBadge value={b.latestFillPct} />
              </td>
              <td className={`px-4 py-3 ${b.status === 'needs_pickup' ? 'text-red-600 font-medium' : ''}`}>
                {b.status}
              </td>
              <td className="px-4 py-3">
                {b.latestReadingAt ? new Date(b.latestReadingAt).toLocaleString() : '-'}
              </td>
              <td className="px-4 py-3">
                <Link to={`/bins/${b._id}/history`} className="mr-2 px-3 py-1 rounded border hover:bg-gray-50">
                History
                </Link>
                <button
                  onClick={() => setEditingBin(b)}
                  className="mr-2 px-3 py-1 rounded border hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                onClick={() => simulateFill(b, 85)}
                className="mr-2 px-3 py-1 rounded border hover:bg-gray-50"
                >
                Mark 85%
                </button>
                <button
                  onClick={() => remove(b._id)}
                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!bins.length && (
            <tr>
              <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                No bins yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
