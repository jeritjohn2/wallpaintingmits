'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Navbar from '../navbar/page';
import Sidebar from '../sidebar/page';
import locationsData from '../location.json';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const locations = locationsData.locations;

export default function ViewContractor() {
  const [contractorSessions, setContractorSessions] = useState([]);
  const [contractorEmail, setContractorEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [nearestLocationData, setNearestLocationData] = useState(null);
  const [deleteWallId, setDeleteWallId] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    const email = localStorage.getItem('selectedContractorEmail');
    setContractorEmail(email);

    const fetchContractorImages = async () => {
      if (!email) {
        console.error('No email found in local storage');
        setLoading(false);
        return;
      }

      try {
        const contractorQuery = query(collection(db, 'Walls'), where('contractorEmail', '==', email));
        const querySnapshot = await getDocs(contractorQuery);

        const sessions = {};

        if (!querySnapshot.empty) {
          querySnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const imageUrls = data.url || [];

            if (!sessions[doc.id]) {
              sessions[doc.id] = { sessionData: data, imageUrls: [], wallId: doc.id };
            }

            sessions[doc.id].imageUrls.push(...imageUrls);
          });

          setContractorSessions(Object.values(sessions));

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

    return R * c;
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
          longitude: lon,
        };
      }
    }

    return nearestLocation;
  };

  const updateStatus = async (sessionId, status) => {
    try {
      await updateDoc(doc(db, 'Walls', sessionId), { status });
      setContractorSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.sessionData.wallId === sessionId
            ? { ...session, sessionData: { ...session.sessionData, status } }
            : session
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteWall = async (wallId) => {
    try {
      await deleteDoc(doc(db, 'Walls', wallId));
      setContractorSessions((prevSessions) =>
        prevSessions.filter((session) => session.wallId !== wallId)
      );
      setDeleteWallId(null);
    } catch (error) {
      console.error('Error deleting wall:', error);
    }
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
      <div className="flex flex-col items-start p-5 w-full ml-64">
        <Navbar />
        <button
          onClick={() => router.push('/manager')}
          className="bg-blue-600 text-white px-4 py-2 mt-[15vh] rounded-md mb-1 hover:bg-blue-700"
        >
          Back
        </button>
        <h1 className="text-gray-300 text-2xl font-semibold mb-5 mt-11">
          Images taken by {contractorEmail}
        </h1>
        <div className="flex flex-col gap-6 w-full">
        {contractorSessions.length > 0 ? (
            contractorSessions.map((session, sessionIndex) => (
              <div
                key={sessionIndex}
                className={`border border-gray-600 rounded-lg p-6 mb-4 ${
                  session.sessionData.status === 'PENDING' ? 'bg-orange-600':null
                }  ${
                  session.sessionData.status === 'APPROVED' ? 'bg-green-700' : null
                } 
                ${
                  session.sessionData.status === 'REJECTED' ? 'bg-red-700' : null
                }`}
              >
                <h2 className={`text-lg font-semibold text-gray-300 mb-3`}>
                  Wall ID: {session.sessionData.wallId} - Final Status: {session.sessionData.status}
                </h2>

                <p className="text-gray-300 font-bold">Model Status: {session.sessionData.modelStatus || 'N/A'}</p>
                <p className="text-gray-300">Latitude: {session.sessionData.location?._lat || 'N/A'}</p>
                <p className="text-gray-300">Longitude: {session.sessionData.location?._long || 'N/A'}</p>

                {nearestLocationData && (
                  <div className="mt-2">
                    <p className="text-gray-300">
                      Nearest Location: {nearestLocationData.address} ({nearestLocationData.latitude}, {nearestLocationData.longitude})
                    </p>
                  </div>
                )}

                {session.sessionData.remark && (
                          <div className="mt-4 p-4 border rounded-md ">
                            <h3 className=" font-semibold">Remarks By Contractor : </h3>
                            <p className="">{session.sessionData.remark}</p>
                          </div>
                        )}
                  <br />
                <div className="flex flex-wrap gap-4">
                  {session.imageUrls.map((url, imgIndex) => (
                    <div
                      key={imgIndex}
                      className="relative w-32 h-32 cursor-pointer"
                      onClick={() => {
                        const encodedUrl = encodeURIComponent(url);
                        window.open(decodeURIComponent(encodedUrl), '_blank');
                      }}
                    >
                      <Image src={url} alt={`Image ${imgIndex}`} layout="fill" objectFit="cover" />
                    </div>
                  ))}
                </div>
                <div className="flex mt-4 space-x-4">
                  <button
                    onClick={() => updateStatus(session.sessionData.wallId, 'APPROVED')}
                    className="px-4 py-2 bg-green-600 rounded-md text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(session.sessionData.wallId, 'REJECTED')}
                    className="px-4 py-2 bg-red-600 rounded-md text-white"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setDeleteWallId(session.wallId)}
                    className="px-4 py-2 bg-red-600 rounded-md text-white"
                  >
                    Delete Wall
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300">No images available for this contractor.</p>
          )}
        </div>

        {deleteWallId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-gray-300 mb-4">Are you sure you want to delete this wall?</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => deleteWall(deleteWallId)}
                  className="px-6 py-2 bg-red-600 rounded-md text-white"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteWallId(null)}
                  className="px-6 py-2 bg-gray-600 rounded-md text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
