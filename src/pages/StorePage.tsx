import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Store, Package, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface StoreData {
  id: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  owner_id: string;
}

const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadStoreData();
    }
  }, [storeId]);

  const loadStoreData = async () => {
    setLoading(true);
    
    // Check if current user is the owner
    const { data: { session } } = await supabase.auth.getSession();
    
    // Load store info
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .maybeSingle();
    
    if (storeError || !storeData) {
      console.error("Error loading store:", storeError);
      setLoading(false);
      return;
    }
    
    setStore(storeData);
    setIsOwner(session?.user?.id === storeData.owner_id);

    // Load store products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    
    if (productsError) {
      console.error("Error loading products:", productsError);
      setLoading(false);
      return;
    }

    if (productsData) {
      const formatted = productsData.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        detailedDescription: p.description || "",
        price: Number(p.price),
        images: p.images || ['/placeholder.svg'],
        category: p.category,
        sellerId: p.seller_id,
        sellerName: storeData.store_name,
        stock: p.stock || 0,
        discount: p.discount || 0,
        sold: p.sold || 0
      }));
      
      setProducts(formatted);

      // Group by category
      const byCategory: Record<string, Product[]> = {};
      formatted.forEach((product) => {
        const cat = product.category.charAt(0).toUpperCase() + product.category.slice(1);
        if (!byCategory[cat]) {
          byCategory[cat] = [];
        }
        byCategory[cat].push(product);
      });
      setProductsByCategory(byCategory);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Store className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-4">This store doesn't exist or has been removed.</p>
          <Link to="/" className="px-6 py-2 bg-foreground text-background rounded-sm hover:bg-foreground/90">
            Go Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Store Banner */}
      <div 
        className="w-full h-48 md:h-64 bg-muted relative"
        style={store.banner_url ? { backgroundImage: `url(${store.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto flex items-end gap-4">
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={store.store_name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="text-white mb-2 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{store.store_name}</h1>
              {store.description && (
                <p className="text-white/80 text-sm md:text-base mt-1 line-clamp-2">{store.description}</p>
              )}
            </div>
            {isOwner && (
              <Link to="/store-management">
                <Button variant="secondary" size="sm" className="shrink-0">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Store
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Store Stats */}
        <div className="flex items-center gap-6 mb-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>{products.length} Products</span>
          </div>
          <div>
            {Object.keys(productsByCategory).length} Categories
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Products Yet</h2>
            <p className="text-muted-foreground">This store hasn't added any products yet.</p>
          </div>
        ) : (
          Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <section key={category} className="mb-12">
              <h2 className="text-xl font-bold mb-4">{category}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <Footer />

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

export default StorePage;
