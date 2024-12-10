'use client';

import React, { useState, useEffect } from 'react';
import { FaHome, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [role, setRole] = useState('');
  const router = useRouter();

  // Load role from localStorage on initial load
  useEffect(() => {
    const currRole = localStorage.getItem('currRole');
    if (currRole) {
      setRole(currRole);
    }
  }, []); // Run only once when the component is first mounted


  

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
      signOut(auth);
      await signInWithEmailAndPassword(auth, localStorage.getItem('oldEmail'), localStorage.getItem('oldPass'));
      console.log(localStorage.getItem('oldEmail'));
      console.log(localStorage.getItem('oldPass'));

      // Close the modal and clear form fields
      setShowAddUserModal(false);
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
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
