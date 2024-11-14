// src/Admin.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Admin() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('currRole');

    if (role !== 'Admin') {
      setErrorMessage('You must be logged in as an admin to view this page.');
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'Managers')),
      (querySnapshot) => {
        const fetchedManagers = [];
        querySnapshot.forEach((doc) => {
          fetchedManagers.push({
            id: doc.id,
            email: doc.data().email,
          });
        });

        setManagers(fetchedManagers);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Navbar />
      <Sidebar />
      <div className="ml-64 pt-16 w-full p-8">
        <div className="flex flex-wrap justify-start gap-6 p-4">
          {managers.length > 0 ? (
            managers.map((manager) => (
              <div
                key={manager.id}
                className="bg-gray-800 rounded-lg shadow-lg p-4 w-48 h-48 flex items-center justify-center"
              >
                <p className="text-gray-300 text-[0.8rem] font-semibold text-center">
                  {manager.email}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-lg text-center">No managers found</p>
          )}
        </div>
      </div>
    </div>
  );
}
