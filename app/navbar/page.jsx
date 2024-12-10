'use client';

import React, { useEffect, useState } from 'react';

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState({
    email: '',
    role: '',
  });

  useEffect(() => {
    const email = localStorage.getItem('currEmail');
    const role = localStorage.getItem('currRole');
    setCurrentUser({ email, role });
  }, []);

  return (
    <nav className="bg-gray-700 text-white shadow-lg w-full fixed top-0 left-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Brand or Logo */}
        <div className="text-2xl font-bold">Wall-Painting</div>

        {/* User Info in Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <p className="font-medium text-sm md:text-base">
            Role: <span className="font-semibold">{currentUser.role || 'N/A'}</span>
          </p>
          <p className="font-medium text-sm md:text-base">
            Email: <span className="font-semibold">{currentUser.email || 'N/A'}</span>
          </p>
        </div>
      </div>
    </nav>
  );
}
