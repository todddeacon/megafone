export default function NotFound() {
  return (
    <main className="flex-1 bg-gray-50 flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-black text-[#064E3B] mb-4">404</p>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-block rounded-lg bg-[#064E3B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#065F46] transition-colors"
        >
          Back to home
        </a>
      </div>
    </main>
  )
}
