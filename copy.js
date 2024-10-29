'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure your Firebase configuration is correctly imported
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase'; // Ensure storage is imported
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';

export default function Manager() {
  // State to store the fetched photos
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading

  // Fetch photos from Firebase Firestore in real-time
  useEffect(() => {
    // Set up the Firestore listener without any specific user filter
    const unsubscribe = onSnapshot(query(collection(db, 'Walls')), async (querySnapshot) => {
      const fetchedPhotos = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const imagePaths = data.imageid; // Assume imageid is an array of image paths

          if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
            // If imageid is not an array or is empty, return data with empty imageUrls
            console.warn(`Document ${doc.id} has no valid image paths.`);
            return { ...data, imageUrls: [] };
          }

          // Map over each path to get its URL
          try {
            const imageUrls = await Promise.all(
              imagePaths.map(async (path) => {
                try {
                  const imageUrl = await getDownloadURL(ref(storage, path));
                  return imageUrl;
                } catch (error) {
                  console.error(`Error fetching image URL for path ${path}:`, error);
                  return null; // Return null if there's an error fetching this URL
                }
              })
            );

            // Return the document data along with an array of valid image URLs
            return {
              ...data,
              imageUrls: imageUrls.filter((url) => url !== null), // Filter out any null URLs
            };
          } catch (error) {
            console.error(`Error processing image URLs for document ${doc.id}:`, error);
            return { ...data, imageUrls: [] };
          }
        })
      );

      setPhotos(fetchedPhotos);
      setLoading(false); // Set loading to false after data is fetched
    });

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Show loading or message when data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
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
          {photos.length > 0 ? (
            // Iterate over each contractor
            photos.map((photo, index) => (
              // Iterate over each image URL and display them in their own separate box
              photo.imageUrls && photo.imageUrls.length > 0 ? (
                photo.imageUrls.map((url, urlIndex) => (
                  <div key={`${photo.id}-${urlIndex}`} className="bg-gray-800 rounded-lg shadow-lg p-4">
                    {/* Image */}
                    <div className="bg-gray-700 rounded-lg shadow-md p-2">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={photo.caption || 'Photo'}
                          className="w-32 h-32 object-cover rounded-md"
                        />
                      </a>
                    </div>

                    {/* Contractor's Name */}
                    {photo.contractorName && (
                      <p className="text-gray-300 text-lg font-semibold text-center mt-2">
                        Contractor: {photo.contractorName}
                      </p>
                    )}

                    {/* Optional Caption */}
                    {photo.caption && (
                      <p className="text-gray-300 text-md font-semibold text-center mt-1">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p key={`${photo.id}-no-images`} className="text-gray-300 text-lg text-center">No images available</p>
              )
            ))
          ) : (
            <p className="text-gray-300 text-lg text-center">No contractors found with images</p>
          )}
        </div>
      </div>
    </div>
  );
}
