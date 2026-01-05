import { ShoppingBag, Store } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: {
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
    storeId?: string;
    storeName?: string;
  };
  onClick: () => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock === 0) {
      toast.error("Out of stock");
      return;
    }
    
    const discountedPrice = product.discount && product.discount > 0 
      ? product.price * (1 - product.discount / 100) 
      : product.price;

    addItem({
      id: product.id,
      title: product.title,
      price: discountedPrice,
      image: product.images?.[0] || '/placeholder.svg',
      seller_id: product.sellerId,
    });
    toast.success("Added to cart");
  };

  const handleStoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const discountedPrice = product.discount && product.discount > 0 
    ? product.price * (1 - product.discount / 100) 
    : product.price;

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/50 rounded-sm mb-3">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Discount badge */}
        {product.discount !== undefined && product.discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-sm font-medium">
            -{product.discount}%
          </span>
        )}

        {/* Quick add to cart button - bottom left */}
        <button 
          onClick={handleAddToCart}
          className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80 transition-colors shadow-md"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>

        {/* Stock warning */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="font-medium text-sm truncate">{product.title}</h3>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">
            ₦{discountedPrice.toLocaleString()}
          </p>
          {product.discount !== undefined && product.discount > 0 && (
            <p className="text-xs line-through text-muted-foreground">
              ₦{product.price.toLocaleString()}
            </p>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        )}
        {product.storeId && product.storeName && (
          <Link 
            to={`/store/${product.storeId}`}
            onClick={handleStoreClick}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            <Store className="h-3 w-3" />
            <span>{product.storeName}</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;