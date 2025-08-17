import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

export default function TruckList({ trucks, setTrucks, setEditingTruck }) {
  const { user } = useAuth();

  const remove = async (id) => {
    if (!window.confirm('Delete this truck?')) return;
    try {
      await axiosInstance.delete(`/api/trucks/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTrucks(prev => prev.filter(t => t._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Delete failed');
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="text-left">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Plate</th>
            <th className="px-4 py-2">Capacity (L)</th>
            <th className="px-4 py-2">Fuel</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Odometer</th>
            <th className="px-4 py-2">Last Service</th>
            <th className="px-4 py-2">Location</th>
            <th className="px-4 py-2 w-48">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trucks.map((t) => (
            <tr key={t._id} className="border-t">
              <td className="px-4 py-2">{t.name || '-'}</td>
              <td className="px-4 py-2">{t.plateNumber}</td>
              <td className="px-4 py-2">{t.capacityLitres}</td>
              <td className="px-4 py-2 capitalize">{t.fuelType}</td>
              <td className={`px-4 py-2 capitalize ${
                t.status === 'maintenance' ? 'text-yellow-700' :
                t.status === 'in_service' ? 'text-blue-700' : 'text-green-700'
              }`}>
                {t.status}
              </td>
              <td className="px-4 py-2">{t.odometerKm ?? '-'}</td>
              <td className="px-4 py-2">{t.lastServiceAt ? new Date(t.lastServiceAt).toLocaleDateString() : '-'}</td>
              <td className="px-4 py-2">
                {t.location?.lat ?? '-'}, {t.location?.lng ?? '-'}
              </td>
              <td className="px-4 py-2">
                <button onClick={() => setEditingTruck(t)} className="mr-2 px-3 py-1 rounded border hover:bg-gray-50">Edit</button>
                <button onClick={() => remove(t._id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
              </td>
            </tr>
          ))}
          {!trucks.length && (
            <tr>
              <td colSpan="9" className="px-4 py-6 text-center text-gray-500">No trucks yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
