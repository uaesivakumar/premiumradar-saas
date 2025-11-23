/**
 * PremiumRadar Landing Page
 * Phase 2 - Initial scaffold
 */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        {/* Logo/Brand */}
        <h1 className="text-6xl font-bold mb-4">
          Premium<span className="text-blue-600">Radar</span>
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          AI-Powered Sales Intelligence Platform
        </p>

        {/* Status Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          Powered by UPR OS v1.0.0
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Start Free Trial
          </button>
          <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Watch Demo
          </button>
        </div>

        {/* Features Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🎯 Smart Discovery</h3>
            <p className="text-gray-600">
              AI-powered lead discovery across multiple sources with region-aware filtering.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📊 Intelligent Scoring</h3>
            <p className="text-gray-600">
              Q/T/L/E scoring with regional modifiers for UAE, India, and US markets.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">💬 AI Assistant</h3>
            <p className="text-gray-600">
              Conversational interface with SIVA cognitive intelligence integration.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
