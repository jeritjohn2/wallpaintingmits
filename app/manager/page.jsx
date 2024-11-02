// src/Manager.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming you still need to access Firestore
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Manager() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(''); // State to store error messages

  // Check user's role from local storage
  useEffect(() => {
    const role = localStorage.getItem('currRole');

    if (role !== 'Manager') {
      // If not a manager, set an error message and exit early
      setErrorMessage('You must be logged in as a manager to view this page.');
      setLoading(false); // Set loading to false since we are done processing
      return; // Exit the useEffect if not a manager
    }

    // Fetch contractors if the user is a manager
    const unsubscribe = onSnapshot(
      query(collection(db, 'Walls')),
      (querySnapshot) => {
        const fetchedContractors = [];
        const uniqueEmails = new Set(); // Set to keep track of unique emails

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
        setLoading(false); // Set loading to false once data is fetched
      }
    );

    return () => unsubscribe();
  }, [router]);

  const handleCardClick = (contractorEmail) => {
    localStorage.setItem('selectedContractorEmail', contractorEmail);
    router.push("/view");
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
          {contractors.length > 0 ? (
            contractors.map((contractor) => (
              <div
                key={contractor.id}
                className="bg-gray-800 rounded-lg shadow-lg p-4 cursor-pointer w-48 h-48 flex items-center justify-center"
                onClick={() => handleCardClick(contractor.contractorEmail)}
              >
                <p className="text-gray-300 text-[0.8rem] font-semibold text-center">
                  {contractor.contractorEmail}
                </p>
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
