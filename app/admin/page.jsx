'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
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

    // Real-time listener for managers
    const managerQuery = query(collection(db, 'Users'), where('role', '==', 'Manager'));
    const unsubscribe = onSnapshot(
      managerQuery,
      (querySnapshot) => {
        const fetchedManagers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email,
        }));
        setManagers(fetchedManagers);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching managers:', error);
        setErrorMessage('Failed to load managers.');
        setLoading(false);
      }
    );

    // Cleanup on unmount
    return () => unsubscribe();
  }, [router]);

  const handleDeleteManager = async (managerId) => {
    try {
      // Step 1: Delete the manager from Firestore (Users collection)
      await deleteDoc(doc(db, 'Users', managerId));
      console.log(`Deleted manager with ID: ${managerId} from Firestore`);

      // Step 2: Remove the deleted manager from the UI state
      setManagers((prevManagers) =>
        prevManagers.filter((manager) => manager.id !== managerId)
      );
    } catch (error) {
      console.error('Error deleting manager:', error);
      setErrorMessage('Failed to delete manager.');
    }
  };

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
                className="bg-gray-800 rounded-lg shadow-lg p-4 w-48 h-48 flex flex-col items-center justify-center"
              >
                <p className="text-gray-300 text-[0.8rem] font-semibold text-center mb-2">
                  {manager.email}
                </p>
                <button
                  onClick={() => handleDeleteManager(manager.id)}
                  className="mt-2 px-4 py-1 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
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
