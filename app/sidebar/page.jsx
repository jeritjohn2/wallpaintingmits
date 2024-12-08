'use client';

import React, { useState, useEffect } from 'react';
import { FaHome, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { storage, auth, db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { doc, arrayUnion, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [image, setImage] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const currRole = localStorage.getItem('currRole');
    setRole(currRole);
  }, []);

  const handleFileChange = (e) => setImage(e.target.files[0]);

  const upload = () => {
    if (image) {
      const path = `images/${uuidv4()}_${image.name}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
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

  const handleAddUserClick = () => {
    if (role === 'Manager' || role === 'Admin') {
      setShowAddUserModal(true);
    } else {
      alert('Only managers or admins can add users.');
    }
  };

  const handleAddUser = async () => {
    const userRole = role === 'Admin' ? 'Manager' : 'Contractor';

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
      const userUid = userCredential.user.uid;

      // Add user details to the Firestore database
      await setDoc(doc(db, 'Users', userUid), {
        email: userEmail,
        role: userRole,
        uid: userUid,
      });

      console.log(`${userRole} added:`, userEmail);
      alert(`${userRole} successfully added: ${userEmail}`);
      setShowAddUserModal(false);

      // Clear the form fields
      setUserEmail('');
      setUserPassword('');
    } catch (error) {
      console.error(`Error adding ${userRole}:`, error.message);
      alert(`Failed to add ${userRole}. Please check the details and try again.`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('currRole');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('An error occurred while logging out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-64 bg-gray-800 shadow-lg text-white pt-16 fixed top-0 left-0">
      <div className="flex flex-col space-y-6 mt-8 px-4">
        <a href="/" className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600">
          <FaHome className="text-xl text-blue-400" />
          <span className="text-lg">Home</span>
        </a>

        <button
          onClick={handleAddUserClick}
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600"
        >
          <FaCog className="text-xl text-yellow-400" />
          <span className="text-lg">Add {role === 'Admin' ? 'Manager' : 'Contractor'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600 mt-4"
        >
          <FaSignOutAlt className="text-xl text-red-400" />
          <span className="text-lg">Logout</span>
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

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Add {role === 'Admin' ? 'Manager' : 'Contractor'}</h2>
            <input
              type="email"
              placeholder={`${role === 'Admin' ? 'Manager' : 'Contractor'} Email`}
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
            />
            <input
              type="password"
              placeholder={`${role === 'Admin' ? 'Manager' : 'Contractor'} Password`}
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowAddUserModal(false)} className="px-4 py-2 bg-red-600 rounded-md text-white">Cancel</button>
              <button onClick={handleAddUser} className="px-4 py-2 bg-green-600 rounded-md text-white">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
