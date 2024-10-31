/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['firebasestorage.googleapis.com'], // Add Firebase storage as an allowed image domain
    },
};


export default nextConfig;
