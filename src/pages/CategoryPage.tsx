import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import Navbar from "@/components/Navbar";
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

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [displayedCount, setDisplayedCount] = useState(30);

  useEffect(() => {
    if (category) {
      loadCategoryProducts();
    }
  }, [category]);

  const loadCategoryProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("category", category)
      .limit(100);
    
    if (error) {
      console.error("Error loading category products:", error);
      return;
    }
    
    if (data) {
      const formattedProducts = data.map((p) => ({
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
      setProducts(formattedProducts);
    }
  };

  const displayedProducts = products.slice(0, displayedCount);
  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{categoryTitle}</h1>
              <p className="text-muted-foreground">Browse all {categoryTitle.toLowerCase()} products</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
              
              {displayedProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No {categoryTitle.toLowerCase()} products available yet.
                </div>
              )}
            </div>

            {displayedCount < products.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setDisplayedCount(prev => prev + 30)}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
                >
                  View More
                </button>
              </div>
            )}
          </div>
        </section>
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

export default CategoryPage;