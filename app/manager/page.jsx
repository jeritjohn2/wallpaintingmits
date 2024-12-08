'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Manager() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('currRole');

    if (role !== 'Manager') {
      setErrorMessage('You must be logged in as a manager to view this page.');
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'Walls')),
      (querySnapshot) => {
        const fetchedContractors = [];
        const uniqueEmails = new Set();

        querySnapshot.docs.forEach((doc) => {
          const contractorEmail = doc.data().contractorEmail;
          if (!uniqueEmails.has(contractorEmail)) {
            uniqueEmails.add(contractorEmail);
            fetchedContractors.push({
              id: doc.id,
              contractorEmail: contractorEmail,
            });
          }
        });

        setContractors(fetchedContractors);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [router]);

  const handleCardClick = (contractorEmail) => {
    localStorage.setItem('selectedContractorEmail', contractorEmail);
    router.push('/view');
  };

  const confirmDelete = (contractorId) => {
    setContractorToDelete(contractorId);
    setShowDeleteModal(true);
  };

  const handleDeleteContractor = async () => {
    if (!contractorToDelete) return;

    try {
      await deleteDoc(doc(db, 'Walls', contractorToDelete));
      console.log(`Deleted contractor with ID: ${contractorToDelete}`);

      setContractors((prevContractors) =>
        prevContractors.filter((contractor) => contractor.id !== contractorToDelete)
      );

      setShowDeleteModal(false);
      setContractorToDelete(null);
    } catch (error) {
      console.error('Error deleting contractor:', error);
      setErrorMessage('Failed to delete contractor.');
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
        <div className="flex flex-wrap justify-start gap-8 p-4">
          {contractors.length > 0 ? (
            contractors.map((contractor) => (
              <div
                key={contractor.id}
                className="bg-gray-800 rounded-lg shadow-lg w-64 h-64 flex flex-col justify-between transition-transform duration-300 transform hover:scale-105"
              >
                <div className="flex flex-1 justify-center items-center">
                  <p
                    className="text-gray-300 text-base font-semibold text-center cursor-pointer"
                    onClick={() => handleCardClick(contractor.contractorEmail)}
                  >
                    {contractor.contractorEmail}
                  </p>
                </div>
                <div className="w-full p-4">
                  <button
                    onClick={() => confirmDelete(contractor.id)}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md w-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-lg text-center">No contractors found</p>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-white text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this contractor? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContractor}
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
