import { useState, useEffect } from "react";
import { Menu, Search, User, X, LogOut, Shield, ChevronDown, Tv, Shirt, Footprints, Home as HomeIcon, Sparkles, Dumbbell, Store } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cart } from "./Cart";

const categories = [
  { icon: Tv, label: "Electronics", value: "electronics" },
  { icon: Shirt, label: "Fashion", value: "fashion" },
  { icon: Footprints, label: "Shoes", value: "shoes" },
  { icon: HomeIcon, label: "Home", value: "home" },
  { icon: Sparkles, label: "Beauty", value: "beauty" },
  { icon: Dumbbell, label: "Sports", value: "sports" },
];

interface NavbarProps {
  onBecomeSellerClick?: () => void;
}

const Navbar = ({ onBecomeSellerClick }: NavbarProps) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [userStoreId, setUserStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session) {
        checkAdminStatus(session.user.id);
        checkSellerStatus(session.user.id);
        checkUserStore(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        checkAdminStatus(session.user.id);
        checkSellerStatus(session.user.id);
        checkUserStore(session.user.id);
      } else {
        setIsAdmin(false);
        setIsSeller(false);
        setUserStoreId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();
    
    setIsAdmin(!!data);
  };

  const checkSellerStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "seller")
      .single();
    
    setIsSeller(!!data);
  };

  const checkUserStore = async (userId: string) => {
    const { data } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    
    setUserStoreId(data?.id || null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleBecomeSellerClick = () => {
    setIsMobileMenuOpen(false);
    if (onBecomeSellerClick) {
      onBecomeSellerClick();
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between px-[5%] py-4 bg-[#f1f2f3] border-b border-black sticky top-0 z-50">
        <img src="/logo1.png" alt="Falcur Mart" className="w-24" />
        
        <div className="flex items-center gap-6">
          <Link to="/" className="nav-link">Home</Link>
          <div className="relative group">
            <button className="nav-link flex items-center gap-1">
              Categories
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {categories.map((category) => (
                <Link
                  key={category.value}
                  to={`/category/${category.value}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <category.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{category.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* New Arrivals Dropdown */}
          <div className="relative group">
            <button className="nav-link flex items-center gap-1">
              New Arrivals
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <Link
                to="/new-arrivals"
                className="block px-4 py-3 hover:bg-accent transition-colors rounded-t-lg text-sm font-medium"
              >
                View All New Arrivals
              </Link>
              <Link
                to="/featured-products"
                className="block px-4 py-3 hover:bg-accent transition-colors rounded-b-lg text-sm font-medium"
              >
                Featured Products
              </Link>
            </div>
          </div>

          {/* Store Dropdown */}
          <div className="relative group">
            <button className="nav-link flex items-center gap-1">
              <Store className="h-4 w-4" />
              Store
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {user && !isSeller && (
                <button
                  onClick={handleBecomeSellerClick}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors rounded-t-lg text-sm font-medium"
                >
                  Become a Seller
                </button>
              )}
              <Link
                to="/stores"
                className="block px-4 py-3 hover:bg-accent transition-colors text-sm font-medium"
              >
                Browse Stores
              </Link>
              {user && !userStoreId && (
                <Link
                  to="/create-store"
                  className="block px-4 py-3 hover:bg-accent transition-colors text-sm font-medium"
                >
                  Create Store
                </Link>
              )}
              {userStoreId && (
                <Link
                  to={`/store/${userStoreId}`}
                  className="block px-4 py-3 hover:bg-accent transition-colors rounded-b-lg text-sm font-medium"
                >
                  Go to My Store
                </Link>
              )}
            </div>
          </div>

        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products & stores..." 
              className="w-48 px-4 py-2 pr-10 rounded-full border border-gray-300 focus:outline-none focus:border-black"
            />
            <button type="submit" className="absolute right-3 top-2.5">
              <Search className="h-5 w-5 text-gray-500 hover:text-black" />
            </button>
          </form>
          
          <Cart />
          
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
          
          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <User className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Navigation - Styled like reference image */}
      <nav className="md:hidden flex items-center justify-between px-4 py-3 bg-[#f5f5f5] sticky top-0 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="w-12 h-12 rounded-full border-2 border-gray-400 flex items-center justify-center"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
        
        <div className="flex items-center gap-1">
          <img src="/logo1.png" alt="Falcur" className="h-8 object-contain" />
        </div>
        
        <Cart />
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black z-[100] md:hidden overflow-y-auto">
          <div className="p-5 border-b border-gray-700 flex justify-between items-center">
            <div className="text-white text-xl font-bold">Falcurmart</div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="p-4">
            <form onSubmit={handleSearch} className="mb-4">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..." 
                className="w-full px-4 py-2 rounded-full border border-gray-600 bg-white"
              />
            </form>
            
            <div className="space-y-1">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block text-white py-3 px-4 rounded-lg hover:bg-white/10"
              >
                Home
              </Link>
              
              {/* Categories Section */}
              <div className="py-2">
                <p className="text-gray-400 text-xs uppercase px-4 mb-2">Categories</p>
                {categories.map((category) => (
                  <Link
                    key={category.value}
                    to={`/category/${category.value}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10"
                  >
                    <category.icon className="h-5 w-5" />
                    <span>{category.label}</span>
                  </Link>
                ))}
              </div>
              
              <div className="border-t border-gray-700 my-4"></div>
              
              <Link 
                to="/new-arrivals" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block text-white py-3 px-4 rounded-lg hover:bg-white/10"
              >
                New Arrivals
              </Link>
              <Link 
                to="/featured-products" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block text-white py-3 px-4 rounded-lg hover:bg-white/10"
              >
                Featured
              </Link>
              
              <div className="border-t border-gray-700 my-4"></div>

              <Link 
                to="/stores" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10"
              >
                <Store className="h-5 w-5" />
                <span>Browse Stores</span>
              </Link>
              
              {/* Create Your Store - Only show if logged in and no store yet */}
              {user && !userStoreId && (
                <Link 
                  to="/create-store" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10"
                >
                  <Store className="h-5 w-5" />
                  <span>Create Your Store</span>
                </Link>
              )}

              {/* Go to My Store - Only show if user has a store */}
              {userStoreId && (
                <Link 
                  to={`/store/${userStoreId}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10"
                >
                  <Store className="h-5 w-5" />
                  <span>Go to My Store</span>
                </Link>
              )}
              
              {/* Become a Seller Button in Menu - Only show if user is not a seller */}
              {user && !isSeller && (
                <button 
                  onClick={handleBecomeSellerClick}
                  className="w-full flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10 text-left"
                >
                  <Store className="h-5 w-5" />
                  <span>Become a Seller</span>
                </button>
              )}
              
              {isSeller && (
                <Link 
                  to="/seller-dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10"
                >
                  <Store className="h-5 w-5" />
                  <span>Seller Dashboard</span>
                </Link>
              )}
              
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Shield className="h-5 w-5" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              
              <div className="border-t border-gray-700 my-4"></div>
              
              {user && (
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10 text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              )}
              
              {!user && (
                <Link 
                  to="/auth" 
                  className="flex items-center gap-3 text-white py-3 px-4 rounded-lg hover:bg-white/10" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nav-link {
          position: relative;
          color: black;
          font-weight: 500;
          transition: color 0.3s;
        }
        .nav-link:hover {
          color: #f39c12;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #f39c12;
          transition: width 0.3s;
        }
        .nav-link:hover::after {
          width: 100%;
        }
      `}</style>
    </>
  );
};

export default Navbar;
