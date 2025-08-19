import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

export default function RoutePlansList({ plans, setPlans, reload }) {
  const { user } = useAuth();

  const remove = async (id) => {
    if (!window.confirm('Delete this route plan?')) return;
    try {
      await axiosInstance.delete(`/api/routes/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPlans(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Delete failed');
    }
  };

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="text-left">
            <th className="px-4 py-2">Created</th>
            <th className="px-4 py-2">Stops</th>
            <th className="px-4 py-2">Total Distance (km)</th>
            <th className="px-4 py-2">Threshold</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 w-48">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(p => (
            <tr key={p._id} className="border-t">
              <td className="px-4 py-2">{new Date(p.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2">{p.stops?.length ?? 0}</td>
              <td className="px-4 py-2">{(p.totalDistanceKm ?? 0).toFixed?.(3) ?? p.totalDistanceKm}</td>
              <td className="px-4 py-2">{p.threshold}%</td>
              <td className="px-4 py-2 capitalize">{p.status}</td>
              <td className="px-4 py-2">
                <Link to={`/routes/${p._id}`} className="mr-2 px-3 py-1 rounded border hover:bg-gray-50">View</Link>
                <button onClick={() => remove(p._id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!plans.length && (
            <tr>
              <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                No route plans yet. Create one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
