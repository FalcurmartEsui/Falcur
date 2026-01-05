import { Link } from "react-router-dom";
import { Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-bold mb-4">Falcurmart Store</h3>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Discover student-exclusive deals, timely restocks, and curated picks every week. Stay connected with effortless shopping and full support—right where you are..
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="https://wa.me/1234567890" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-6 h-6 fill-current"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-300 hover:text-white transition-colors">
                  How to shop with us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-xl font-bold mb-4">Customer Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/faqs" className="text-sm text-gray-300 hover:text-white transition-colors">
                  FAQS
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">
                  CONTACT
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Customer Testimonials
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter - Optional Section */}
          <div>
            <h4 className="text-xl font-bold mb-4">Newsletter</h4>
            <p className="text-sm text-gray-300 mb-4">
              Subscribe to get updates on new arrivals and exclusive deals.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your Email"
                className="flex-1 px-4 py-2 bg-transparent border border-gray-600 rounded-sm text-sm focus:outline-none focus:border-white"
              />
              <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-sm hover:bg-gray-200 transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border border-gray-700 rounded-sm p-4 text-center">
          <p className="text-sm text-gray-300">
            copyright © 2024| Designed by FALCUR CREW .
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Link to="/privacy" className="text-sm text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-gray-500">|</span>
            <Link to="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
