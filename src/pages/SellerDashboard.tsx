import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store, Package, PlusCircle, LogOut, Home, TrendingUp, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import SellerCartNotifications from "@/components/SellerCartNotifications";
import SellerOrderNotifications from "@/components/SellerOrderNotifications";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useImageUpload } from "@/hooks/useImageUpload";
import ImageUploader from "@/components/ImageUploader";

interface Seller {
  id: string;
  shopName: string;
  email: string;
  storeId?: string;
}

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
  sold?: number;
  isFeatured?: boolean;
}

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    images, 
    isUploading, 
    addImages, 
    removeImage, 
    clearImages, 
    uploadImages 
  } = useImageUpload({ bucket: "product-images", maxFiles: 10 });

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    // Check if user has a store
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    
    if (profile) {
      setSeller({
        id: profile.user_id,
        shopName: profile.shop_name || "My Shop",
        email: profile.email,
        storeId: store?.id
      });
      loadProducts(profile.user_id);
    }
  };

  const loadProducts = async (sellerId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId);
    
    if (error) {
      toast({ title: "Error loading products", variant: "destructive" });
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
        sellerName: seller?.shopName || "",
        stock: p.stock || 0,
        discount: p.discount || 0,
        sold: p.sold || 0
      }));
      setProducts(formattedProducts);
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!seller || isSubmitting || isUploading) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      // Upload images using the hook
      const uploadedUrls = await uploadImages(seller.id);
      
      // Use placeholder if no images uploaded
      const productImages = uploadedUrls.length > 0 ? uploadedUrls : ['/placeholder.svg'];

      const isFeatured = formData.get("is_featured") === "on";

      const productData: any = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
        images: productImages,
        category: formData.get("category") as string,
        seller_id: seller.id,
        stock: parseInt(formData.get("stock") as string),
        discount: parseFloat(formData.get("discount") as string) || 0,
        sold: 0,
        is_featured: isFeatured
      };

      // Link product to store if seller has one
      if (seller.storeId) {
        productData.store_id = seller.storeId;
      }

      const { error } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

      if (error) {
        toast({ title: "Error adding product", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Product added successfully!" });
      e.currentTarget.reset();
      clearImages();
      loadProducts(seller.id);
    } catch (err) {
      console.error("Product add error:", err);
      toast({ title: "Error adding product", description: "Please try again", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !seller) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const newProducts: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        
        newProducts.push({
          id: Date.now().toString() + i,
          title: values[0]?.trim() || '',
          description: values[1]?.trim() || '',
          detailedDescription: values[2]?.trim() || '',
          price: parseFloat(values[3]) || 0,
          stock: parseInt(values[4]) || 0,
          category: values[5]?.trim() || 'electronics',
          discount: parseFloat(values[6]) || 0,
          images: ['/placeholder.svg'],
          sellerId: seller.id,
          sellerName: seller.shopName,
          sold: 0
        });
      }

      if (seller) {
        loadProducts(seller.id);
      }
      toast({ title: `Imported ${newProducts.length} products successfully!` });
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const totalSales = products.reduce((sum, p) => sum + (p.sold || 0) * p.price, 0);
  const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);
  const lowStock = products.filter(p => p.stock < 10).length;

  if (!seller) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Store className="h-5 w-5" /> Seller Portal
        </h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-16">
          <nav className="p-6 space-y-2">
            <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent" onClick={() => setIsMobileMenuOpen(false)}>
              <Home className="h-5 w-5" /> Home
            </Link>
            <a href="#dashboard" className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent" onClick={() => setIsMobileMenuOpen(false)}>
              <Package className="h-5 w-5" /> Dashboard
            </a>
            <a href="#products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent" onClick={() => setIsMobileMenuOpen(false)}>
              <Package className="h-5 w-5" /> My Products
            </a>
            <a href="#add" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent" onClick={() => setIsMobileMenuOpen(false)}>
              <PlusCircle className="h-5 w-5" /> Add Product
            </a>
            {seller?.storeId ? (
              <Link to={`/store/${seller.storeId}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent" onClick={() => setIsMobileMenuOpen(false)}>
                <Store className="h-5 w-5" /> My Store
              </Link>
            ) : (
              <Link to="/create-store" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent" onClick={() => setIsMobileMenuOpen(false)}>
                <Store className="h-5 w-5" /> Create Store
              </Link>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent w-full text-left mt-8"
            >
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 bg-sidebar text-sidebar-foreground p-6 fixed h-screen overflow-y-auto">
        <h2 className="flex items-center gap-2 text-xl font-bold mb-8">
          <Store className="h-6 w-6" /> Seller Portal
        </h2>
        <nav className="space-y-2">
          <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Home className="h-5 w-5" /> Home
          </Link>
          <a href="#dashboard" className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
            <Package className="h-5 w-5" /> Dashboard
          </a>
          <a href="#products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Package className="h-5 w-5" /> My Products
          </a>
          <a href="#add" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <PlusCircle className="h-5 w-5" /> Add Product
          </a>
          <a href="#analytics" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <TrendingUp className="h-5 w-5" /> Analytics
          </a>
          {seller?.storeId ? (
            <Link to={`/store/${seller.storeId}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Store className="h-5 w-5" /> My Store
            </Link>
          ) : (
            <Link to="/create-store" className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Store className="h-5 w-5" /> Create Store
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left mt-8"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Welcome, {seller.shopName}</h1>
          <div className="flex gap-2">
            <SellerCartNotifications sellerId={seller.id} />
            <SellerOrderNotifications sellerId={seller.id} />
          </div>
        </div>

        {/* Stats */}
        <div id="dashboard" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm text-muted-foreground">Total Products</h3>
                <div className="text-xl md:text-2xl font-bold">{products.length}</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm text-muted-foreground">Total Sales</h3>
                <div className="text-xl md:text-2xl font-bold">₦{totalSales.toLocaleString()}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm text-muted-foreground">Items Sold</h3>
                <div className="text-xl md:text-2xl font-bold">{totalSold}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive text-destructive-foreground rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm text-muted-foreground">Low Stock</h3>
                <div className="text-xl md:text-2xl font-bold">{lowStock}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Section */}
        <section id="analytics" className="bg-card p-4 md:p-6 rounded-lg border border-border mb-8">
          <h3 className="text-lg md:text-xl font-bold mb-4">Sales Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Top Selling Products</h4>
              <div className="space-y-2">
                {products
                  .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm truncate">{p.title}</span>
                      <span className="text-sm font-bold">{p.sold || 0} sold</span>
                    </div>
                  ))}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No products yet</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Low Stock Alert</h4>
              <div className="space-y-2">
                {products
                  .filter(p => p.stock < 10)
                  .map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-destructive/10 rounded">
                      <span className="text-sm truncate">{p.title}</span>
                      <span className="text-sm font-bold text-destructive">{p.stock} left</span>
                    </div>
                  ))}
                {lowStock === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">All products well stocked</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Add Product Form */}
        <section id="add" className="bg-card p-4 md:p-6 rounded-lg border border-border mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-lg md:text-xl font-bold">Add New Product</h3>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Import CSV</label>
              <Input 
                type="file" 
                accept=".csv"
                onChange={handleCSVImport}
                className="w-full md:w-auto"
              />
              <p className="text-xs text-muted-foreground mt-1">Format: title,description,details,price,stock,category,discount</p>
            </div>
          </div>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="title" placeholder="Product Name" required />
              <Input name="price" type="number" step="0.01" placeholder="Price (₦)" required />
            </div>
            <Textarea name="description" placeholder="Short Description" required className="min-h-[80px]" />
            <Textarea name="detailedDescription" placeholder="Detailed Description (shown on product page)" required className="min-h-[120px]" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input name="stock" type="number" placeholder="Stock Quantity" required />
              <Input name="discount" type="number" step="0.01" placeholder="Discount % (optional)" />
              <div></div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <select 
                name="category" 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="shoes">Shoes</option>
                <option value="home">Home & Living</option>
                <option value="beauty">Beauty</option>
                <option value="sports">Sports</option>
              </select>
            </div>
            
            <ImageUploader
              images={images}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              maxFiles={10}
              disabled={isSubmitting || isUploading}
            />
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="is_featured" 
                name="is_featured"
                className="w-4 h-4 rounded border-input"
              />
              <label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">
                Mark as Featured Product
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto bg-black hover:bg-black/90"
              disabled={isSubmitting || isUploading}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> 
              {isSubmitting || isUploading ? "Adding..." : "Add Product"}
            </Button>
          </form>
        </section>

        {/* Products List */}
        <section id="products" className="bg-card p-4 md:p-6 rounded-lg border border-border">
          <h3 className="text-lg md:text-xl font-bold mb-6">My Products</h3>
          <div className="space-y-4">
            {products.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No products yet. Add your first product above!
              </p>
            ) : (
              products.map((product) => (
                <div key={product.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-border rounded-lg">
                  {product.images && product.images.length > 0 && (
                    <img 
                      src={product.images[0]} 
                      alt={product.title}
                      className="w-full md:w-20 h-48 md:h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{product.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                        <p className="text-xs text-muted-foreground">Category: {product.category}</p>
                      </div>
                      {product.discount && product.discount > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="font-bold">₦{product.price.toLocaleString()}</span>
                      <span className={product.stock < 10 ? "text-destructive" : ""}>
                        Stock: {product.stock}
                      </span>
                      <span className="text-muted-foreground">Sold: {product.sold || 0}</span>
                      <span className="text-muted-foreground">
                        {product.images?.length || 0} image{product.images?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this product?")) {
                        const { error } = await supabase
                          .from("products")
                          .delete()
                          .eq("id", product.id);
                        
                        if (error) {
                          toast({ title: "Error deleting product", variant: "destructive" });
                        } else {
                          toast({ title: "Product deleted successfully" });
                          loadProducts(seller.id);
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SellerDashboard;
