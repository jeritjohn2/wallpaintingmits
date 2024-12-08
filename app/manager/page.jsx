'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Manager() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddContractorModal, setShowAddContractorModal] = useState(false);
  const [newContractorEmail, setNewContractorEmail] = useState('');
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
    router.push('/view'); // Only redirect when explicitly needed, not when adding contractors
  };

  const handleAddContractor = async () => {
    try {
      // Add a new contractor to the Firestore database
      await addDoc(collection(db, 'Walls'), {
        contractorEmail: newContractorEmail,
        // You can add other relevant fields here
      });

      // After adding the contractor, reset the email and close the modal
      setNewContractorEmail('');
      setShowAddContractorModal(false);
      alert('Contractor added successfully');
    } catch (error) {
      console.error('Error adding contractor:', error.message);
      alert('Failed to add contractor. Please try again.');
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
    <div className="min-h-screen bg-gray-900 relative flex">
      <Navbar />
      <Sidebar />
      <div className="ml-64 pt-16 w-full p-8">
        <div className="flex flex-wrap justify-start gap-8 p-4">
          {contractors.length > 0 ? (
            contractors.map((contractor) => (
              <div
                key={contractor.id}
                className="bg-gray-800 rounded-lg shadow-lg w-64 h-64 flex flex-col justify-between"
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
                    onClick={() => handleCardClick(contractor.contractorEmail)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md w-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-lg text-center">No contractors found</p>
          )}
        </div>
        
        {/* Add Contractor Modal */}
        {showAddContractorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Add Contractor</h2>
              <input
                type="email"
                placeholder="Contractor's Email"
                value={newContractorEmail}
                onChange={(e) => setNewContractorEmail(e.target.value)}
                className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowAddContractorModal(false)}
                  className="px-4 py-2 bg-red-600 rounded-md text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContractor}
                  className="px-4 py-2 bg-green-600 rounded-md text-white"
                >
                  Add Contractor
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
