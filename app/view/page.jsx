// src/ViewContractor.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';
import locationsData from '../location.json'; // Adjust the path if needed
import Image from 'next/image'; // Import Next.js Image component

const locations = locationsData.locations; // Access the locations array

export default function ViewContractor() {
  const [contractorSessions, setContractorSessions] = useState([]);
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
        const contractorQuery = query(collection(db, 'Walls'), where('contractorEmail', '==', email));
        const querySnapshot = await getDocs(contractorQuery);

        const sessions = {}; // Group images by session

        if (!querySnapshot.empty) {
          querySnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const imageUrls = data.url || []; // Get URLs directly from the 'url' array field

            if (!sessions[doc.id]) {
              sessions[doc.id] = { sessionData: data, imageUrls: [] };
            }

            sessions[doc.id].imageUrls.push(...imageUrls);
          });

          setContractorSessions(Object.values(sessions)); // Convert sessions to an array

          // Check the first session's location for nearest place (if location exists)
          if (Object.values(sessions)[0]?.sessionData?.location) {
            const currentLat = Object.values(sessions)[0].sessionData.location._lat;
            const currentLon = Object.values(sessions)[0].sessionData.location._long;
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
        <div className="flex flex-col gap-6 w-full">
          {contractorSessions.length > 0 ? (
            contractorSessions.map((session, sessionIndex) => (
              <div
                key={sessionIndex}
                className={`border border-gray-600 rounded-lg p-6 mb-4 ${
                  session.sessionData.status === 'APPROVED' ? 'bg-green-700' : 'bg-red-700'
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-300 mb-3">
                  Session {sessionIndex + 1} - Status: {session.sessionData.status}
                </h2>
                {nearestLocationData && (
                  <div className="text-gray-300 mb-4">
                    <p>Nearest Location: {nearestLocationData.address}</p>
                    <p>Latitude: {nearestLocationData.latitude}</p>
                    <p>Longitude: {nearestLocationData.longitude}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  {session.imageUrls.map((url, imgIndex) => (
                    <div key={`${sessionIndex}-${imgIndex}`} className="relative w-32 h-32 overflow-hidden border border-gray-700 rounded-lg">
                      <Image
                        src={url}
                        alt={`Contractor Image ${imgIndex + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300">No images available for this contractor.</p>
          )}
        </div>
      </div>
    </div>
  );
}
