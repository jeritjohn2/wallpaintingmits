'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure your Firebase configuration is correctly imported
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../firebase'; // Ensure auth is imported
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Home() {
  // State to store the fetched photos
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading

  // Fetch photos from Firebase Firestore in real-time
  useEffect(() => {
    const user = auth.currentUser; // Get the current user

    if (!user) {
      // User is not logged in
      setLoading(false);
      return; // Return early if the user is not logged in
    }

    // User is logged in, set up the Firestore listener
    const unsubscribe = onSnapshot(query(collection(db, 'Contractors'), where('uid', '==', user.uid)), async (querySnapshot) => {
      const fetchedPhotos = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const imagePaths = data.imageid; // Assume imageid is an array of image paths

          // If imagePaths is an array, map over each path to get its URL
          if (Array.isArray(imagePaths)) {
            try {
              const imageUrls = await Promise.all(
                imagePaths.map(async (path) => {
                  try {
                    const imageUrl = await getDownloadURL(ref(storage, path));
                    return imageUrl;
                  } catch (error) {
                    console.error(`Error fetching image URL for ${path}:`, error);
                    return null;
                  }
                })
              );

              // Return the document data along with an array of image URLs
              return {
                ...data,
                imageUrls: imageUrls.filter((url) => url !== null), // Filter out any null URLs
              };
            } catch (error) {
              console.error('Error fetching image URLs:', error);
              return { ...data, imageUrls: [] }; // Return an empty array if no URLs can be fetched
            }
          }

          // If imageid is not an array, return the document data as is
          return { ...data, imageUrls: [] };
        })
      );

      setPhotos(fetchedPhotos);
      setLoading(false); // Set loading to false after data is fetched
    });

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Show loading or message when user is not authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Please log in to view your images.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Navbar */}
      <Navbar />
  
      {/* Sidebar */}
      <Sidebar />
  
      {/* Main Content */}
      <div className="ml-64 pt-16 w-full p-8">
        
        {/* Photo Row Container */}
        <div className="flex flex-wrap justify-start gap-6 p-4">
          {photos.map((photo, index) => (
            <div key={photo.id || index} className="bg-gray-800 rounded-lg shadow-lg p-4">
              {/* Image Row */}
              <div className="flex flex-row space-x-4 overflow-x-auto">
                {photo.imageUrls && photo.imageUrls.length > 0 ? (
                  photo.imageUrls.map((url, urlIndex) => (
                    <div key={urlIndex} className="bg-gray-700 rounded-lg shadow-md p-2">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={photo.caption || 'Photo'}
                          className="w-32 h-32 object-cover rounded-md"
                        />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300 text-lg text-center">No images available</p>
                )}
              </div>
  
              {/* Optional Caption */}
              {photo.caption && (
                <p className="text-gray-300 text-lg font-semibold text-center mt-2">
                  {photo.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
