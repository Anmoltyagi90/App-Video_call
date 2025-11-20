import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi"; // Hamburger menu icons

const Landing = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Navbar */}
      <nav className="p-5 flex items-center justify-between">
        <Link to="/" className="text-white text-3xl font-extrabold tracking-wide">
          Apna Video Call
        </Link>

        {/* Desktop menu */}
        <ul className="hidden md:flex items-center gap-6 text-lg text-white">
          <li>
            <Link to="/guest" className="hover:text-orange-400 transition">
              Join as Guest
            </Link>
          </li>
          <li>
            <Link to="/auth" className="hover:text-orange-400 transition">
              Register
            </Link>
          </li>
          <li>
            <Link
              to="/auth"
              className="bg-orange-600 py-2 px-4 rounded-xl hover:bg-orange-700 transition font-semibold shadow-md text-white"
            >
              Login
            </Link>
          </li>
        </ul>

        {/* Mobile menu icon */}
        <div className="md:hidden text-white text-3xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <HiX /> : <HiMenu />}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <ul className="flex flex-col gap-4 text-lg text-white text-center bg-black/70 p-6 md:hidden">
          <li>
            <Link to="/guest" className="hover:text-orange-400 transition" onClick={() => setMenuOpen(false)}>
              Join as Guest
            </Link>
          </li>
          <li>
            <Link to="/auth" className="hover:text-orange-400 transition" onClick={() => setMenuOpen(false)}>
              Register
            </Link>
          </li>
          <li>
            <Link
              to="/auth"
              className="bg-orange-600 py-2 px-4 rounded-xl hover:bg-orange-700 transition font-semibold shadow-md text-white"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          </li>
        </ul>
      )}

      {/* Main content */}
      <div className="flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-16 mt-10 md:mt-20 gap-10">
        {/* Text */}
        <div className="text-white max-w-xl text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            <span className="text-orange-500">Connect</span> with your Loved Ones
          </h1>

          <p className="mt-5 text-lg md:text-xl opacity-90">
            Cover a distance by Apna Video Call
          </p>

          <Link
            to="/auth"
            className="inline-block mt-6 md:mt-10 bg-orange-600 py-3 px-6 md:px-8 rounded-xl text-lg md:text-xl font-bold hover:bg-orange-700 transition shadow-lg text-white"
          >
            Get Started
          </Link>
        </div>

        {/* Image */}
        <div className="flex justify-center">
          <img
            src="/mobile.png"
            alt="mobile"
            className="w-64 md:w-[380px] drop-shadow-2xl animate-bounce"
          />
        </div>
      </div>
    </div>
  );
};

export default Landing;
