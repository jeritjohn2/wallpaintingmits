'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Manager() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
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
      </div>
    </div>
  );
}
