// src/Sidebar.js
'use client';

import React, { useState } from 'react';
import { FaHome, FaClipboardList, FaCog, FaUpload } from 'react-icons/fa';
import {ref, uploadBytesResumable} from "firebase/storage";
import {storage} from "../firebase"
import { v4 as uuidv4 } from 'uuid';
import {auth, db} from "../firebase"
import {doc, arrayUnion, updateDoc} from "firebase/firestore"

export default function Sidebar() {
  // State for managing modal visibility
  const [showUploadModal, setShowUploadModal] = useState(false);

  // State for storing the selected file
  const [image, setImage] = useState(null);

  // Function to handle file selection
  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  // Function to handle file upload (this function will be called when the user clicks the "Upload" button)
  const upload = () => {
    if (image) {

      const path = `images/${uuidv4()}_${image.name}`
      const storageRef = ref(storage, path);
      const UploadTask = uploadBytesResumable(storageRef, image);

      UploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytestransferred / snapshot.totalBytes) * 100;
          console.log(`upload is ${progress} % done`);
        },
        error => {
          console.error(error.message);
        },
        () => {
          console.log("Upload completed");

          const user = auth.currentUser;
          if(user){
              updateDoc(doc(db, "Walls", user.uid),{
              imageid: arrayUnion(path),
            })
          }
          setShowUploadModal(false);
        }
      )

    } else {
      alert('Please select a file to upload.');
    }
  };

  return (
    <div className="min-h-screen w-64 bg-gray-800 shadow-lg text-white pt-16 fixed top-0 left-0">
      {/* Sidebar Content */}
      <div className="flex flex-col space-y-6 mt-8 px-4">
        {/* Sidebar Menu Items */}
        <a
          href="#"
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600 transition duration-200 ease-in-out"
        >
          <FaHome className="text-xl text-blue-400" />
          <span className="text-lg">Home</span>
        </a>

        <a
          href="#"
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600 transition duration-200 ease-in-out"
        >
          <FaClipboardList className="text-xl text-green-400" />
          <span className="text-lg">Tasks</span>
        </a>

        <a
          href="#"
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600 transition duration-200 ease-in-out"
        >
          <FaCog className="text-xl text-yellow-400" />
          <span className="text-lg">Settings</span>
        </a>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-3 p-3 rounded-md bg-gray-700 hover:bg-gray-600 transition duration-200 ease-in-out"
        >
          <FaUpload className="text-xl text-red-400" />
          <span className="text-lg">Upload</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Upload Photo</h2>
            
            {/* File Input */}
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md mb-4"
            />

            {/* Display file name if a file is selected */}
            {image && (
              <p className="text-gray-300 mb-4">
                Selected file: <span className="text-white">{image.name}</span>
              </p>
            )}

            {/* Modal Buttons */}
            <div className="flex justify-end space-x-4">
              {/* Cancel Button */}
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700"
              >
                Cancel
              </button>
              
              {/* Upload Button */}
              <button
                onClick={upload}
                className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
