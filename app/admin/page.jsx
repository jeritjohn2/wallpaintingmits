'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Make sure `auth` is imported for authentication
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Admin() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
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

  const handleAddManager = async () => {
    try {
      // Create a new manager in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, newManagerEmail, newManagerPassword);
      const userUid = userCredential.user.uid;

      // Add user details to the Firestore database as Manager
      await setDoc(doc(db, 'Users', userUid), {
        email: newManagerEmail,
        role: 'Manager',
        uid: userUid,
      });

      console.log('Manager added:', newManagerEmail);
      alert('Manager successfully added');
      setShowAddManagerModal(false); // Close modal after adding the manager

      // Clear the form fields
      setNewManagerEmail('');
      setNewManagerPassword('');
    } catch (error) {
      console.error('Error adding manager:', error.message);
      alert('Failed to add manager. Please try again.');
    }
  };

  const handleDeleteManager = async () => {
    if (managerToDelete) {
      try {
        // Remove the manager's document from Firestore
        const userRef = doc(db, 'Users', managerToDelete.id);
        await deleteDoc(userRef);

        console.log('Manager deleted:', managerToDelete.email);
        setManagers((prevManagers) =>
          prevManagers.filter((manager) => manager.id !== managerToDelete.id)
        );
        setShowDeleteConfirmation(false); // Close the confirmation modal
        alert('Manager successfully deleted');
      } catch (error) {
        console.error('Error deleting manager:', error.message);
        alert('Failed to delete manager. Please try again.');
      }
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
                className="bg-gray-800 rounded-lg shadow-lg p-6 w-64 h-72 flex flex-col items-center justify-between"
              >
                <div className="flex flex-1 justify-center items-center">
                  <p className="text-gray-300 text-[0.9rem] font-semibold text-center">
                    {manager.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setManagerToDelete(manager);
                    setShowDeleteConfirmation(true);
                  }}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
                >
                  Delete Manager
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-lg text-center">No managers found</p>
          )}
        </div>

        {/* Modal for adding a new manager */}
        {showAddManagerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Add Manager</h2>
              <input
                type="email"
                placeholder="Manager's Email"
                value={newManagerEmail}
                onChange={(e) => setNewManagerEmail(e.target.value)}
                className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
              />
              <input
                type="password"
                placeholder="Manager's Password"
                value={newManagerPassword}
                onChange={(e) => setNewManagerPassword(e.target.value)}
                className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowAddManagerModal(false)}
                  className="px-4 py-2 bg-red-600 rounded-md text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddManager}
                  className="px-4 py-2 bg-green-600 rounded-md text-white"
                >
                  Add Manager
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Deletion */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Confirm Deletion</h2>
              <p className="text-white mb-4">
                Are you sure you want to delete {managerToDelete?.email}?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-4 py-2 bg-red-600 rounded-md text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteManager}
                  className="px-4 py-2 bg-green-600 rounded-md text-white"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
