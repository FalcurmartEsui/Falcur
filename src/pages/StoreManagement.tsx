import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Store, Upload, Plus, Package, ArrowLeft, Trash2, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "shoes", label: "Shoes" },
  { value: "home", label: "Home" },
  { value: "beauty", label: "Beauty" },
  { value: "sports", label: "Sports" },
];

interface Product {
  id: string;
  title: string;
  price: number;
  description: string | null;
  category: string;
  images: string[];
  stock: number;
  discount: number;
  is_active: boolean;
}

interface StoreData {
  id: string;
  store_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
}

const StoreManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  
  // Store form data
  const [storeForm, setStoreForm] = useState({
    storeName: "",
    description: "",
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    discount: "",
    gender: "unisex",
  });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    checkAuthAndStore();
  }, []);

  const checkAuthAndStore = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?redirect=store-management");
      return;
    }
    
    setUser(session.user);

    // Get user's store
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    if (!storeData) {
      navigate("/create-store");
      return;
    }

    setStore(storeData);
    setStoreForm({
      storeName: storeData.store_name,
      description: storeData.description || "",
    });
    setBannerPreview(storeData.banner_url);
    setLogoPreview(storeData.logo_url);

    // Load store products
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeData.id)
      .order("created_at", { ascending: false });

    if (productsData) {
      setProducts(productsData);
    }

    setLoading(false);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - productImages.length;
    
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      toast.info(`Only ${remainingSlots} more image(s) can be added`);
    }
    
    setProductImages(prev => [...prev, ...filesToAdd]);
    
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setProductImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setProductImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const setMainImage = (index: number) => {
    if (index === 0) return; // Already main
    
    // Move to first position
    setProductImages(prev => {
      const newArr = [...prev];
      const [removed] = newArr.splice(index, 1);
      newArr.unshift(removed);
      return newArr;
    });
    setProductImagePreviews(prev => {
      const newArr = [...prev];
      const [removed] = newArr.splice(index, 1);
      newArr.unshift(removed);
      return newArr;
    });
    toast.success("Set as main image");
  };

  const updateStore = async () => {
    if (!store || !user) return;
    setSubmitting(true);

    try {
      let bannerUrl = store.banner_url;
      let logoUrl = store.logo_url;

      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${user.id}-banner.${fileExt}`;
        
        await supabase.storage
          .from("product-images")
          .upload(`stores/${fileName}`, bannerFile, { upsert: true });

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(`stores/${fileName}`);
        bannerUrl = publicUrl;
      }

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}-logo.${fileExt}`;
        
        await supabase.storage
          .from("product-images")
          .upload(`stores/${fileName}`, logoFile, { upsert: true });

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(`stores/${fileName}`);
        logoUrl = publicUrl;
      }

      const { error } = await supabase
        .from("stores")
        .update({
          store_name: storeForm.storeName,
          description: storeForm.description || null,
          banner_url: bannerUrl,
          logo_url: logoUrl,
        })
        .eq("id", store.id);

      if (error) throw error;

      setStore({
        ...store,
        store_name: storeForm.storeName,
        description: storeForm.description,
        banner_url: bannerUrl,
        logo_url: logoUrl,
      });
      setEditingStore(false);
      setBannerFile(null);
      setLogoFile(null);
      toast.success("Store updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update store");
    } finally {
      setSubmitting(false);
    }
  };

  const addProduct = async () => {
    if (!store || !user) return;
    
    if (!productForm.title.trim() || !productForm.price || !productForm.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (let i = 0; i < productImages.length; i++) {
        const file = productImages[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(`products/${fileName}`, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(`products/${fileName}`);
          imageUrls.push(publicUrl);
        }
      }

      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          seller_id: user.id,
          store_id: store.id,
          title: productForm.title.trim(),
          description: productForm.description.trim() || null,
          price: parseFloat(productForm.price),
          category: productForm.category,
          stock: parseInt(productForm.stock) || 0,
          discount: parseInt(productForm.discount) || 0,
          images: imageUrls.length > 0 ? imageUrls : ['/placeholder.svg'],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [newProduct, ...prev]);
      setProductForm({
        title: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        discount: "",
        gender: "unisex",
      });
      setProductImages([]);
      setProductImagePreviews([]);
      setShowProductForm(false);
      toast.success("Product added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error("Failed to delete product");
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== productId));
    toast.success("Product deleted");
  };

  const toggleProductActive = async (productId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !isActive })
      .eq("id", productId);

    if (error) {
      toast.error("Failed to update product");
      return;
    }

    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, is_active: !isActive } : p
    ));
    toast.success(isActive ? "Product deactivated" : "Product activated");
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/store/${store?.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Manage Your Store</h1>
            <p className="text-muted-foreground">Customize your store and manage products</p>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Store Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Products ({products.length})
                    </CardTitle>
                    <CardDescription>Manage products in your store</CardDescription>
                  </div>
                  <Button onClick={() => setShowProductForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showProductForm && (
                  <Card className="mb-6 border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">Add New Product</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product Title *</Label>
                          <Input
                            value={productForm.title}
                            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                            placeholder="Product name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select 
                            value={productForm.category} 
                            onValueChange={(v) => setProductForm({ ...productForm, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Product description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Price ($) *</Label>
                          <Input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Discount (%)</Label>
                          <Input
                            type="number"
                            value={productForm.discount}
                            onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <Select 
                            value={productForm.gender} 
                            onValueChange={(v) => setProductForm({ ...productForm, gender: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unisex">Unisex</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Product Images (Max 5 - First is main image)</Label>
                        <p className="text-xs text-muted-foreground">The first image will be displayed as the main product image</p>
                        <div className="flex flex-wrap gap-2">
                          {productImagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative w-20 h-20 group">
                              <img src={preview} alt="" className="w-full h-full object-cover rounded border-2 border-border" style={idx === 0 ? { borderColor: 'hsl(var(--primary))' } : {}} />
                              {idx === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center py-0.5 rounded-b">Main</span>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded">
                                {idx !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setMainImage(idx)}
                                    className="w-6 h-6 bg-primary text-primary-foreground rounded text-xs"
                                    title="Set as main"
                                  >
                                    ★
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeProductImage(idx)}
                                  className="w-6 h-6 bg-destructive text-destructive-foreground rounded text-xs"
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          {productImages.length < 5 && (
                            <label className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:bg-muted">
                              <Plus className="h-6 w-6 text-muted-foreground" />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleProductImageChange}
                              />
                            </label>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{productImages.length}/5 images</p>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={addProduct} disabled={submitting}>
                          {submitting ? "Adding..." : "Add Product"}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setShowProductForm(false);
                          setProductForm({
                            title: "",
                            description: "",
                            price: "",
                            category: "",
                            stock: "",
                            discount: "",
                            gender: "unisex",
                          });
                          setProductImages([]);
                          setProductImagePreviews([]);
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No products yet</p>
                    <p className="text-sm text-muted-foreground">Add your first product to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map(product => (
                      <div key={product.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <img
                          src={product.images?.[0] || '/placeholder.svg'}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            ${product.price} · {product.category} · Stock: {product.stock}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleProductActive(product.id, product.is_active)}
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Settings
                </CardTitle>
                <CardDescription>Customize your store appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Banner Preview/Upload */}
                <div className="space-y-2">
                  <Label>Store Banner</Label>
                  <div 
                    className="w-full h-40 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative cursor-pointer"
                    style={bannerPreview ? { backgroundImage: `url(${bannerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!bannerPreview && (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload banner</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Store Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-8 w-8 text-muted-foreground" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">Click to change logo</p>
                  </div>
                </div>

                {/* Store Name */}
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button onClick={updateStore} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default StoreManagement;