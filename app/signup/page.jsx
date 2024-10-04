'use client'

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {auth, db} from "../firebase"
import {setDoc, doc} from "firebase/firestore"
import {toast} from "react-toastify"

export default function Signup() {
  // State variables for storing input values
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      if(user){
        await setDoc(doc(db, "Users", user.uid),{
          uid: user.uid,
          email: user.email,
          role: role,
        })
        if(role == 'Contractor'){
          await setDoc(doc(db, "Contractors", user.uid),{
            uid: user.uid,
            email: user.email,
          })
          router.push("/signin");
        }
        else if(role == 'Manager'){
          await setDoc(doc(db, "Manager", user.uid),{
            uid: user.uid,
            email: user.email,
          })
          router.push("/signin");
        }
      }
      
    }
    catch(error){
      console.log(error.message)
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-white">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {/* Role Dropdown */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="principal">Head Office</option>
              <option value="Manager">Manager</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
