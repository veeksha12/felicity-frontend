import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="disco-ball w-32 h-32 mx-auto mb-8 rounded-full animate-disco-spin" />
        <h1 className="text-8xl font-display text-gradient mb-4">404</h1>
        <h2 className="text-3xl font-display mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn-retro py-3 px-6 flex items-center gap-2">
            <Home size={20} />
            Go Home
          </Link>
          <button onClick={() => window.history.back()} className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2">
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
