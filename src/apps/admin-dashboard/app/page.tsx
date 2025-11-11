export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to the Invoice App Admin Dashboard
        </p>
        <p className="text-sm text-gray-500">
          This is the root page. Dashboard layout is in /dashboard route.
        </p>
      </div>
    </div>
  );
}
