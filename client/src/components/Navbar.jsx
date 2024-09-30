import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [loggedIn, setLoggedIn] = useState(true);

  return (
    <div className="bg-slate-900 text-white py-3 px-4 flex justify-between">
      <Link to="/">
        <h1>EMS</h1>
      </Link>
      <div className="navbar-links flex gap-4 relative">
        <Link to="#">Home</Link>
        <Link to="/search">Search Events</Link>
        <Link to="#">Create Event</Link>
        {loggedIn ? (
          <>
            <Link to="#">Organized by Me</Link>
            <Link to="#">Visited</Link>
            <Link to="#">Account</Link>
          </>
        ) : (
          <Link to="#">Login</Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
