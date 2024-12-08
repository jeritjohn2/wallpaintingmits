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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState(null);
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

  const handleDeleteManager = async () => {
    if (!managerToDelete) return;

    try {
      // Delete the manager from Firestore
      await deleteDoc(doc(db, 'Users', managerToDelete));
      console.log(`Deleted manager with ID: ${managerToDelete} from Firestore`);

      // Remove the deleted manager from the UI state
      setManagers((prevManagers) =>
        prevManagers.filter((manager) => manager.id !== managerToDelete)
      );

      setShowDeleteModal(false);
      setManagerToDelete(null);
    } catch (error) {
      console.error('Error deleting manager:', error);
      setErrorMessage('Failed to delete manager.');
    }
  };

  const confirmDelete = (managerId) => {
    setManagerToDelete(managerId);
    setShowDeleteModal(true);
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
                className="bg-gray-800 rounded-lg shadow-lg p-6 w-64 h-72 flex flex-col items-center justify-between transition-transform duration-300 transform hover:scale-105"
              >
                {/* Container for centering email */}
                <div className="flex flex-1 justify-center items-center">
                  <p className="text-gray-300 text-[0.9rem] font-semibold text-center">
                    {manager.email}
                  </p>
                </div>

                <div className="w-full flex justify-center mt-auto">
                  <button
                    onClick={() => confirmDelete(manager.id)}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md w-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete Manager
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-lg text-center">No managers found</p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-white text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this manager? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteManager}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
