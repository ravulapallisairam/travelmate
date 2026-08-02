export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-3">TravelMate AI</h3>
          <p className="text-sm text-gray-400">Your AI-powered travel companion for discovering, planning, and managing unforgettable journeys.</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li>Destinations</li>
            <li>Packages</li>
            <li>Trip Planner</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li>About Us</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Newsletter</h4>
          <div className="flex gap-2">
            <input placeholder="Your email" className="px-3 py-2 rounded-lg text-sm w-full bg-gray-800 border border-gray-700 focus:outline-none" />
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-sm">Join</button>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 pb-6">© 2026 TravelMate AI. All rights reserved.</div>
    </footer>
  );
}