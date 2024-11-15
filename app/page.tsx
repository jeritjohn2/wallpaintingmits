import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gray-800 text-white flex items-center justify-center min-h-screen p-8">
      <div className="flex flex-col gap-12 items-center">
        {/* Heading */}

        {/* Sign Up Button */}
        <Link
          href="/signup"
          className="w-[20vw] bg-blue-600 text-white text-2xl py-6 rounded-lg text-center shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
        >
          Sign Up
        </Link>

        {/* Sign In Button */}
        <Link
          href="/signin"
          className="w-[20vw] max-w-lg bg-green-600 text-white text-2xl py-6 rounded-lg text-center shadow-xl transform hover:scale-105 transition duration-300 ease-in-out"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
