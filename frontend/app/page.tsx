import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">BikeFix</h1>
        
        <p className="text-xl text-gray-700 mb-8">
          Find an experienced mechanic to repair your bicycle.
          Fast, reliable, and convenient.
        </p>

        <p className="text-gray-600 mb-12 text-lg">
          Upload a photo of the problem, get offers from mechanics, and choose the best one.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Login
          </Link>
          
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Register
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📸 Upload a Photo</h3>
            <p className="text-gray-600">Take a photo of your bike problem</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Get Offers</h3>
            <p className="text-gray-600">Mechanics will submit offers with their services and prices</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">✅ Choose the Best</h3>
            <p className="text-gray-600">Chat and select the most convenient option</p>
          </div>
        </div>
      </div>
    </main>
  );
}
