import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MarqueeBar from "@/components/MarqueeBar";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import FeaturesSection from "@/components/FeaturesSection";
import SellerModal from "@/components/SellerModal";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  description: string;
  detailedDescription: string;
  category: string;
  sellerId: string;
  sellerName: string;
  stock: number;
  discount?: number;
  sold?: number;
}

interface CategoryProducts {
  category: string;
  products: Product[];
  totalCount: number;
}

const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "shoes", label: "Shoes" },
  { value: "home", label: "Home" },
  { value: "beauty", label: "Beauty" },
  { value: "sports", label: "Sports" },
];

const PROMO_BANNERS = [
  {
    title: "Find Your Perfect Look at Falcur's Stylish Collection",
    subtitle: "Welcome to Falcurmart! Step into our stylish and trendy store and discover the latest in fashion and apparel. Come and experience the unique and vibrant atmosphere.",
    buttonText: "Shop Now",
    buttonLink: "/category/fashion",
    bgColor: "bg-muted",
    textColor: "text-foreground",
    discountText: "50%"
  },
  {
    title: "New Electronics Deals",
    subtitle: "Discover the latest gadgets and tech accessories at unbeatable prices. Limited time offers available.",
    buttonText: "Explore",
    buttonLink: "/category/electronics",
    bgColor: "bg-foreground",
    textColor: "text-background"
  },
  {
    title: "Shoes Collection",
    subtitle: "Step into style with our exclusive shoe collection. Comfort meets fashion for every occasion.",
    buttonText: "View Collection",
    buttonLink: "/category/shoes",
    bgColor: "bg-muted",
    textColor: "text-foreground",
    discountText: "30%"
  },
];

const Index = () => {
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<CategoryProducts[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    localStorage.removeItem("products");
    loadNewArrivals();
    loadFeaturedProducts();
    loadCategoryProducts();
  }, []);

  const loadNewArrivals = async () => {
    // Get products created within the last 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gte("created_at", twoDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(6);
    
    if (data) {
      const formatted = data.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        detailedDescription: p.description || "",
        price: Number(p.price),
        images: p.images || ['/placeholder.svg'],
        category: p.category,
        sellerId: p.seller_id,
        sellerName: "",
        stock: p.stock || 0,
        discount: p.discount || 0,
        sold: p.sold || 0
      }));
      setNewArrivals(formatted);
    }
  };

  const loadFeaturedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .limit(8);
    
    if (data) {
      const formatted = data.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        detailedDescription: p.description || "",
        price: Number(p.price),
        images: p.images || ['/placeholder.svg'],
        category: p.category,
        sellerId: p.seller_id,
        sellerName: "",
        stock: p.stock || 0,
        discount: p.discount || 0,
        sold: p.sold || 0
      }));
      setFeaturedProducts(formatted);
    }
  };

  const loadCategoryProducts = async () => {
    const categoryData: CategoryProducts[] = [];
    
    for (const cat of CATEGORIES) {
      // Get count first
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("category", cat.value);
      
      // Get 10 products
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", cat.value)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (data && data.length > 0) {
        const formatted = data.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description || "",
          detailedDescription: p.description || "",
          price: Number(p.price),
          images: p.images || ['/placeholder.svg'],
          category: p.category,
          sellerId: p.seller_id,
          sellerName: "",
          stock: p.stock || 0,
          discount: p.discount || 0,
          sold: p.sold || 0
        }));
        
        categoryData.push({
          category: cat.label,
          products: formatted,
          totalCount: count || 0
        });
      }
    }
    
    setCategoryProducts(categoryData);
  };

  return (
    <div className="min-h-screen bg-background">
      <MarqueeBar />
      <Navbar onBecomeSellerClick={() => setIsSellerModalOpen(true)} />
      
      <main>
        <div className="fir-info py-12 text-center px-4">
          <h1 className="text-4xl font-bold mb-4">Welcome to Falcur mart esui</h1>
          <p className="text-muted-foreground text-lg">The best shop to shop for all your needs we offer all of your need</p>
        </div>

        <FeaturesSection />

        {/* New Arrivals Section - 6 products, 2-day window */}
        {newArrivals.length > 0 && (
          <section className="py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">New Arrivals</h2>
                <p className="text-muted-foreground text-sm">Our new arrivals are built to withstand your activities while keeping you looking your best!</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {newArrivals.slice(0, 6).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <Link 
                  to="/new-arrivals" 
                  className="inline-flex items-center justify-center px-8 py-3 bg-foreground text-background rounded-sm text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  See All
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="py-8 px-4 bg-muted/30">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Featured Products</h2>
                <Link to="/featured-products" className="text-sm hover:underline">View all</Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}


        {/* Category Sections with Promo Banners between them */}
        {categoryProducts.map((catData, index) => (
          <div key={catData.category}>
            <section className="py-12 px-4 border-t border-border">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{catData.category}</h2>
                  {catData.totalCount > 10 && (
                    <Link 
                      to={`/category/${catData.category.toLowerCase()}`} 
                      className="text-sm hover:underline"
                    >
                      See All ({catData.totalCount})
                    </Link>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {catData.products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              </div>
            </section>
            
            {/* Show promo banner after every 2 categories */}
            {index < categoryProducts.length - 1 && (index + 1) % 2 === 0 && PROMO_BANNERS[Math.floor(index / 2)] && (
              <PromoBanner {...PROMO_BANNERS[Math.floor(index / 2)]} />
            )}
          </div>
        ))}

      </main>

      <Footer />

      <SellerModal 
        isOpen={isSellerModalOpen} 
        onClose={() => setIsSellerModalOpen(false)} 
      />
      
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Index;
