// src/components/Header.tsx
import { Link } from 'react-router-dom';
import { MessageSquare, Mic} from 'lucide-react';

const Header = () => {

  return (
    <header className="w-full shadow-md">
      {/* Top Bar */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Mic className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">VoiceAI</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </Link>
            {/* Add more navigation items here */}
          </nav>
        </div>
      </div>

    </header>
  );
};

export default Header;