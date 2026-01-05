import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import { supabase } from "@/integrations/supabase/client";

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

interface ProductGridProps {
  selectedCategory?: string;
}

const ProductGrid = ({ selectedCategory }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    
    // Set up realtime subscription for products
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);
    
    if (error) {
      console.error("Error loading products:", error);
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

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : products;

  return (
    <>
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {selectedCategory ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Products` : 'New Arrivals'}
            </h2>
            <a href="#" className="text-sm hover:underline">View all</a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => setSelectedProduct(product)}
              />
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {selectedCategory 
                  ? `No ${selectedCategory} products available yet.`
                  : 'No products available yet. Sellers can add products from their dashboard.'}
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default ProductGrid;
