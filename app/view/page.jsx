"use client"
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';
import locationsData from '../location.json'; // Adjust the path accordingly
const locations = locationsData.locations; // Access the locations array

export default function ViewContractor() {
  const [images, setImages] = useState([]);
  const [contractorEmail, setContractorEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [nearestLocationData, setNearestLocationData] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('selectedContractorEmail'); // Retrieve email from local storage
    setContractorEmail(email); // Set the contractor's email in state

    const fetchContractorImages = async () => {
      if (!email) {
        console.error('No email found in local storage');
        setLoading(false);
        return;
      }

      try {
        const contractorQuery = query(collection(db, 'Walls'), where('email', '==', email));
        const querySnapshot = await getDocs(contractorQuery);

        if (!querySnapshot.empty) {
          const fetchedImages = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
              const data = doc.data();
              const imagePaths = data.imageid || []; // Ensure that imageid is an array

              // Fetch URLs for each image path
              const imageUrls = await Promise.all(
                imagePaths.map(async (path) => {
                  try {
                    const url = await getDownloadURL(ref(storage, path));
                    return url;
                  } catch (error) {
                    console.error(`Error fetching image URL for path ${path}:`, error);
                    return null;
                  }
                })
              );

              return { ...data, imageUrls: imageUrls.filter((url) => url !== null) }; // Only keep valid URLs
            })
          );

          setImages(fetchedImages); // Set images as an array of fetched images
          if (fetchedImages[0]?.location) {
            const currentLat = fetchedImages[0].location._lat; // Get latitude from the first image data
            const currentLon = fetchedImages[0].location._long; // Get longitude from the first image data
            const nearest = findNearestLocation(currentLat, currentLon);
            setNearestLocationData(nearest);
          }
        } else {
          console.warn('No documents found for this email');
        }
      } catch (error) {
        console.error('Error fetching contractor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractorImages();
  }, []);

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
  };

  const findNearestLocation = (currentLat, currentLon) => {
    let nearestLocation = null;
    let nearestDistance = Infinity;

    for (const location of locations) {
      const lat = parseFloat(location.Latitude);
      const lon = parseFloat(location.Longitude);
      const distance = haversineDistance(currentLat, currentLon, lat, lon);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestLocation = {
          address: location.Address,
          latitude: lat,
          longitude: lon
        };
      }
    }

    return nearestLocation;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Loading contractor images...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar />
      <div className="flex flex-col items-start p-8 w-full ml-64">
        <Navbar />
        <h1 className="text-gray-300 text-2xl font-semibold mb-5 mt-11">Images taken by {contractorEmail}</h1>
        <div className="flex flex-wrap gap-6 justify-start w-full">
          {images.length > 0 ? (
            images.map((imageData, index) => (
              imageData.imageUrls.map((url, imgIndex) => (
                <div
                  key={`${index}-${imgIndex}`}
                  className={`border border-gray-600 rounded-lg p-4 w-full flex items-center ${
                    imageData.approved ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  <img src={url} alt={`Contractor Image ${imgIndex + 1}`} className="w-32 h-32 object-cover rounded-md mr-4" />
                  <div className="text-gray-300">
                    <p>Approved: {imageData.approved ? 'Yes' : 'No'}</p>
                    {nearestLocationData && (
                      <>
                        <p>Place: {nearestLocationData.address}</p>
                        <p>Latitude: {nearestLocationData.latitude}</p>
                        <p>Longitude: {nearestLocationData.longitude}</p>
                      </>
                    )}
                  </div>
                </div>
              ))
            ))
          ) : (
            <p className="text-gray-300">No images available for this contractor.</p>
          )}
        </div>
      </div>
    </div>
  );
}
