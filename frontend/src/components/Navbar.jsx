import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `mr-2 px-3 py-2 rounded transition
       ${isActive ? 'bg-white text-blue-600' : 'hover:bg-blue-500'}`
    }
  >
    {children}
  </NavLink>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to={user ? '/bins' : '/'} className="text-2xl font-bold">
        Garbage Collection Manager
      </Link>

      <div className="flex items-center">
        {user ? (
          <>
            <NavItem to="/bins">Bins</NavItem>
            <NavItem to="/routes">Routes</NavItem>
            <NavItem to="/profile">Profile</NavItem>
            <button
              onClick={handleLogout}
              className="ml-2 bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavItem to="/login">Login</NavItem>
            <Link
              to="/register"
              className="ml-2 bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
