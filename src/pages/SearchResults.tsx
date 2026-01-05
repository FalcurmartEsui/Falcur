import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Search, Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  discount: number;
  sold: number;
}

interface StoreResult {
  id: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  product_count?: number;
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (query) {
      searchAll();
    } else {
      setProducts([]);
      setStores([]);
      setLoading(false);
    }
  }, [query]);

  const searchAll = async () => {
    setLoading(true);
    try {
      // Search products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          profiles:seller_id (shop_name, full_name)
        `)
        .eq("is_active", true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(50);

      if (productsError) throw productsError;

      const formattedProducts = (productsData || []).map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images || [],
        description: product.description || "",
        detailedDescription: product.description || "",
        category: product.category,
        sellerId: product.seller_id,
        sellerName: product.profiles?.shop_name || product.profiles?.full_name || "Unknown Seller",
        stock: product.stock || 0,
        discount: product.discount || 0,
        sold: product.sold || 0,
      }));

      setProducts(formattedProducts);

      // Search stores
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .ilike("store_name", `%${query}%`)
        .limit(20);

      if (storesError) throw storesError;

      // Get product counts for each store
      const storesWithCounts = await Promise.all(
        (storesData || []).map(async (store) => {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("is_active", true);
          
          return { ...store, product_count: count || 0 };
        })
      );

      setStores(storesWithCounts);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Search className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">
            Search results for "{query}"
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 && stores.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground">
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="products">
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="stores">
                Stores ({stores.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              {products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No products found</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stores">
              {stores.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No stores found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((store) => (
                    <Link
                      key={store.id}
                      to={`/store/${store.id}`}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.store_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Store className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{store.store_name}</h3>
                        {store.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{store.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {store.product_count} product{store.product_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

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

export default SearchResults;
