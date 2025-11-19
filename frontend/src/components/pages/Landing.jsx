import React from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div
      className="h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <nav className="p-5">
        <ul className="text-white flex items-center justify-between">

          <li className="text-3xl font-extrabold tracking-wide">
            <Link to="/" className="text-white">Apna Video Call</Link>
          </li>

          <div className="flex items-center gap-6 text-lg">
            <li className="hover:text-orange-400 transition">
              <Link to="/guest" className="text-white hover:text-orange-400 transition">Join as Guest</Link>
            </li>

            <li className="hover:text-orange-400 transition">
              <Link to="/register" className="text-white hover:text-orange-400 transition">Register</Link>
            </li>

            <li>
              <Link
                to="/auth"
                className="bg-orange-600 py-2 px-4 rounded-xl hover:bg-orange-700 transition font-semibold shadow-md text-white no-underline"
              >
                Login
              </Link>
            </li>
          </div>

        </ul>
      </nav>

      <div className="flex items-center justify-between px-16 mt-20">
        
        <div className="text-white max-w-xl">
          <h1 className="text-6xl font-extrabold leading-tight">
            <span className="text-orange-500">Connect</span> with your Loved Ones
          </h1>

          <p className="mt-5 text-xl opacity-90">
            Cover a distance by Apna Video Call
          </p>

          <Link
            to="/auth"
            className="inline-block mt-10 bg-orange-600 py-3 px-8 rounded-xl text-xl font-bold hover:bg-orange-700 transition shadow-lg text-white no-underline"
          >
            Get Started
          </Link>
        </div>

        <div>
          <img
            src="/mobile.png"
            alt="mobile"
            className="w-[380px] drop-shadow-2xl animate-bounce"
          />
        </div>

      </div>
    </div>
  );
};

export default Landing;
