import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Store, Package } from "lucide-react";

interface StoreWithCount {
  id: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  productCount: number;
}

const AllStores = () => {
  const [stores, setStores] = useState<StoreWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    // Get all active stores
    const { data: storesData, error } = await supabase
      .from("stores")
      .select("id, store_name, description, logo_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading stores:", error);
      setLoading(false);
      return;
    }

    // Get product counts for each store
    const storesWithCounts: StoreWithCount[] = [];
    
    for (const store of storesData || []) {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", store.id)
        .eq("is_active", true);
      
      storesWithCounts.push({
        ...store,
        productCount: count || 0
      });
    }

    setStores(storesWithCounts);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">All Stores</h1>
          <p className="text-muted-foreground">
            Browse our curated collection of stores
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Stores Yet</h2>
            <p className="text-muted-foreground mb-4">Be the first to create a store!</p>
            <Link 
              to="/create-store"
              className="inline-flex items-center gap-2 px-6 py-2 bg-foreground text-background rounded-sm hover:bg-foreground/90"
            >
              Create Your Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stores.map((store) => (
              <Link
                key={store.id}
                to={`/store/${store.id}`}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {store.logo_url ? (
                    <img 
                      src={store.logo_url} 
                      alt={store.store_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {store.store_name}
                  </h3>
                  {store.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {store.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Package className="h-3 w-3" />
                    <span>{store.productCount} products</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AllStores;
