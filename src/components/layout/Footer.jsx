import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
  ];

  return (
    <footer className="relative bg-black border-t border-disco-pink/20 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="vinyl-record absolute top-10 -left-20 w-64 h-64" />
        <div className="vinyl-record absolute bottom-10 -right-20 w-96 h-96" />
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src="/public/logo.png"
                  alt="Felicity Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-display tracking-wider text-gradient">FELICITY</h3>
                <p className="text-xs text-gray-400">IIIT HYDERABAD</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Experience the magic of Felicity - IIIT Hyderabad's annual cultural extravaganza.
              Join us for unforgettable moments of art, music, and celebration.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-display mb-6 text-gradient">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-disco-pink transition-colors flex items-center space-x-2 group"
                  >
                    <span className="w-0 group-hover:w-4 h-0.5 bg-disco-pink transition-all duration-300" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-display mb-6 text-gradient">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin size={18} className="text-disco-pink mt-1 flex-shrink-0" />
                <span className="text-sm">
                  International Institute of Information Technology,
                  Gachibowli, Hyderabad - 500032
                </span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail size={18} className="text-disco-pink flex-shrink-0" />
                <a
                  href="mailto:contact@felicity.iiit.ac.in"
                  className="text-sm hover:text-disco-pink transition-colors"
                >
                  contact@felicity.iiit.ac.in
                </a>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone size={18} className="text-disco-pink flex-shrink-0" />
                <a
                  href="tel:+919876543210"
                  className="text-sm hover:text-disco-pink transition-colors"
                >
                  +91 98765 43210
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} Felicity, IIIT Hyderabad. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 retro-grid opacity-10" />
    </footer>
  );
};

export default Footer;
