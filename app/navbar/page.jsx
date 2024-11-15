// src/Navbar.js
'use client';

import React from 'react';

export default function Navbar() {
  return (
    <nav className="bg-gray-700 text-white shadow-lg w-full fixed top-0 left-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Brand or Logo */}
        <div className="text-2xl font-bold">Wall-Painting</div>
        
        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-10">
        </ul>
      </div>
    </nav>
  );
}
