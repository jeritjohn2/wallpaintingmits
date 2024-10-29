'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Manager() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch only contractor usernames and emails from Firebase Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'Walls'), where('role', '==', 'Contractor')), // Filter for role 'contractor'
      (querySnapshot) => {
        const fetchedContractors = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Include document ID for handling clicks
          email: doc.data().email, // Assume each document has an email field
        }));

        setContractors(fetchedContractors);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCardClick = (email, id) => {
    // Store the contractor's email in local storage
    localStorage.setItem('selectedContractorEmail', email);
    // Redirect to the view page with the contractor's ID
    router.push("/view");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
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
                onClick={() => handleCardClick(contractor.email, contractor.id)}
              >
                <p className="text-gray-300 text-[0.8rem] font-semibold text-center">
                  {contractor.email}
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
