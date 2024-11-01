// src/Sidebar.js
'use client';

import React, { useState, useEffect } from 'react';
import { FaHome, FaClipboardList, FaCog, FaUpload } from 'react-icons/fa';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../firebase';
import { doc, arrayUnion, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Sidebar() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddContractorModal, setShowAddContractorModal] = useState(false);
  const [image, setImage] = useState(null);
  const [contractorEmail, setContractorEmail] = useState('');
  const [contractorPassword, setContractorPassword] = useState('');
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('currRole');
    setIsManager(role === 'Manager');
  }, []);

  const handleFileChange = (e) => setImage(e.target.files[0]);

  const upload = () => {
    if (image) {
      const path = `images/${uuidv4()}_${image.name}`;
      const storageRef = ref(storage, path);
      const UploadTask = uploadBytesResumable(storageRef, image);

      UploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress} % done`);
        },
        (error) => console.error(error.message),
        async () => {
          const user = auth.currentUser;
          if (user) {
            await updateDoc(doc(db, 'Walls', user.uid), {
              imageid: arrayUnion(path),
            });
          }
          setShowUploadModal(false);
        }
      );
    } else {
      alert('Please select a file to upload.');
    }
  };

  const handleAddContractorClick = () => {
    if (isManager) {
      setShowAddContractorModal(true);
    } else {
      alert('Only managers can add contractors.');
    }
  };

  const handleAddContractor = async () => {
    try {
      // Create new contractor user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, contractorEmail, contractorPassword);
      const contractorUid = userCredential.user.uid;

      // Add contractor's details to Firestore "Users" collection
      await setDoc(doc(db, 'Users', contractorUid), {
        email: contractorEmail,
        role: 'Contractor',
        uid: contractorUid,
      });

      console.log('Contractor added:', contractorEmail);
      setShowAddContractorModal(false);
    } catch (error) {
      console.error('Error adding contractor:', error.message);
      alert('Failed to add contractor. Please check the details and try again.');
    }
  };

  return (
    <div className="min-h-screen w-64 bg-gray-800 shadow-lg text-white pt-16 fixed top-0 left-0">
      <div className="flex flex-col space-y-6 mt-8 px-4">
        <a href="#" className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600">
          <FaHome className="text-xl text-blue-400" />
          <span className="text-lg">Home</span>
        </a>

        <a href="#" className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600">
          <FaClipboardList className="text-xl text-green-400" />
          <span className="text-lg">Tasks</span>
        </a>

        <button
          onClick={handleAddContractorClick}
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600"
        >
          <FaCog className="text-xl text-yellow-400" />
          <span className="text-lg">Add Contractor</span>
        </button>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600"
        >
          <FaUpload className="text-xl text-red-400" />
          <span className="text-lg">Upload</span>
        </button>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Upload Photo</h2>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
            />
            {image && <p className="text-gray-300 mb-4">Selected file: <span className="text-white">{image.name}</span></p>}
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-red-600 rounded-md text-white">Cancel</button>
              <button onClick={upload} className="px-4 py-2 bg-blue-600 rounded-md text-white">Upload</button>
            </div>
          </div>
        </div>
      )}

      {showAddContractorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Add Contractor</h2>
            <input
              type="email"
              placeholder="Contractor Email"
              value={contractorEmail}
              onChange={(e) => setContractorEmail(e.target.value)}
              className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
            />
            <input
              type="password"
              placeholder="Contractor Password"
              value={contractorPassword}
              onChange={(e) => setContractorPassword(e.target.value)}
              className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowAddContractorModal(false)} className="px-4 py-2 bg-red-600 rounded-md text-white">Cancel</button>
              <button onClick={handleAddContractor} className="px-4 py-2 bg-green-600 rounded-md text-white">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
