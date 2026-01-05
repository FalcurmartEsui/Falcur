import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  sellerName: string;
  stock: number;
  discount?: number;
}

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    // Check stock availability
    if (product.stock < 1) {
      toast.error("This product is currently unavailable");
      return;
    }

    // Add to cart using the cart store
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || "",
      seller_id: product.sellerId,
    });

    // Play notification sound
    const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZSA0PVKzi8LBiHgU5jtXzxnwpBSh+zPLaizsIGGS56+efTgwOUKvl8bllHAY6ktjyyHkrBSZ8zPDdkT4KFGG36uujVhMKSKDh8sFuIwQvhdPz0oU0Bx1xxO/jmEYNEFOr5O+wYx4GOpLY88h5LAUpfszw3JA+ChVhtuvspVYVCkig4PK/bSMEMIXU89KFMwcdccPu45lGDRBTq+Tv");
    audio.volume = 0.3;
    audio.play().catch(() => {});

    toast.success(`${product.title} has been added to your cart`);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      idx === currentImageIndex ? "border-black" : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">Category: {product.category}</p>
              <p className="text-sm text-muted-foreground mb-4">Sold by: {product.sellerName}</p>
              <div className="flex items-center gap-4 mb-4">
                {product.discount && product.discount > 0 ? (
                  <>
                    <p className="text-3xl font-bold">₦{(product.price * (1 - product.discount / 100)).toLocaleString()}</p>
                    <p className="text-xl line-through text-muted-foreground">₦{product.price.toLocaleString()}</p>
                    <span className="bg-destructive text-destructive-foreground text-sm px-2 py-1 rounded">
                      -{product.discount}% OFF
                    </span>
                  </>
                ) : (
                  <p className="text-3xl font-bold">₦{product.price.toLocaleString()}</p>
                )}
              </div>
              <p className={`text-sm ${product.stock < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-line">{product.detailedDescription}</p>
            </div>

            <Button 
              onClick={handleAddToCart}
              className="w-full bg-black hover:bg-black/90 text-white"
              disabled={product.stock < 1}
            >
              {product.stock < 1 ? 'OUT OF STOCK' : 'ADD TO CART'} <ShoppingCart className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
