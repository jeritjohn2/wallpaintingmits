// src/Home.js
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase'; // Make sure Firestore is correctly imported
import { auth } from '../firebase'; // Ensure auth is imported correctly
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';
import Image from 'next/image';

export default function Home() {
  const [urls, setUrls] = useState([]); // State to store image URLs
  const [loading, setLoading] = useState(true); // Loading state
  const [errorMessage, setErrorMessage] = useState(''); // State to store error messages

  useEffect(() => {
    const role = localStorage.getItem('currRole');

    // Check if the role is not contractor
    if (role !== 'Contractor') {
      setErrorMessage('You must be logged in as a contractor to view this page.');
      setLoading(false);
      return; // Exit early if the user is not a contractor
    }

    const user = auth.currentUser;

    if (!user) {
      setErrorMessage('Please log in to view your images.');
      setLoading(false);
      return; // Exit early if the user is not logged in
    }

    // Query Firestore for the current user's document in the "Walls" collection
    const unsubscribe = onSnapshot(
      query(collection(db, 'Walls'), where('contractorEmail', '==', user.email)),
      (querySnapshot) => {
        const userData = querySnapshot.docs[0]?.data(); // Access the first matching document
        if (userData && Array.isArray(userData.url)) {
          setUrls(userData.url); // Set URLs from the "url" array
        } else {
          setUrls([]); // Set empty if no URLs found
        }
        setLoading(false); // Set loading to false once data is fetched
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

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
          {urls.length > 0 ? (
            urls.map((imageUrl, index) => (
              <div key={index} className="bg-gray-800 rounded-lg shadow-lg p-4">
                <div className="bg-gray-700 rounded-lg shadow-md p-2">
                  <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={imageUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-32 h-32 object-cover rounded-md"
                    />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-lg text-center">No images available</p>
          )}
        </div>
      </div>
    </div>
  );
}
