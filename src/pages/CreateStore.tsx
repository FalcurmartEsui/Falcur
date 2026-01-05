import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, Upload, ArrowRight, AlertCircle } from "lucide-react";

const CreateStore = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [existingStore, setExistingStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    hall: "",
    bankName: "",
    bankAccountNumber: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndStore();
  }, []);

  const checkAuthAndStore = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?redirect=create-store");
      return;
    }
    
    setUser(session.user);

    // Check if stores are enabled
    const { data: settings } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "store_enabled")
      .maybeSingle();

    if (settings?.value && typeof settings.value === 'object' && 'enabled' in settings.value) {
      setStoreEnabled((settings.value as any).enabled);
    }

    // Check if user already has a store
    const { data: store } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    if (store) {
      setExistingStore(store);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (!formData.storeName.trim() || !formData.hall || !formData.bankName.trim() || !formData.bankAccountNumber.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      let logoUrl = null;
      let bannerUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}-logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(`stores/${fileName}`, logoFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(`stores/${fileName}`);
          logoUrl = publicUrl;
        }
      }

      // Upload banner if provided
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${user.id}-banner.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(`stores/${fileName}`, bannerFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(`stores/${fileName}`);
          bannerUrl = publicUrl;
        }
      }

      // Create store
      const { data: store, error } = await supabase
        .from("stores")
        .insert({
          owner_id: user.id,
          store_name: formData.storeName.trim(),
          description: formData.description.trim() || null,
          logo_url: logoUrl,
          banner_url: bannerUrl,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error("You already have a store");
        } else {
          throw error;
        }
        return;
      }

      // Update user profile with hall and bank details
      await supabase
        .from("profiles")
        .update({
          hall: formData.hall,
          bank_name: formData.bankName,
          bank_account_number: formData.bankAccountNumber,
        })
        .eq("user_id", user.id);

      toast.success("Store created successfully!");
      navigate(`/store/${store.id}`);
    } catch (error: any) {
      console.error("Error creating store:", error);
      toast.error(error.message || "Failed to create store");
    } finally {
      setSubmitting(false);
    }
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

  // Store feature is disabled
  if (!storeEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>Store Not Available</CardTitle>
              <CardDescription>
                The store feature is currently not available. Please check back later.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate("/")} variant="outline">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // User already has a store
  if (existingStore) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Store className="h-8 w-8" />
              </div>
              <CardTitle>You Already Have a Store</CardTitle>
              <CardDescription>
                You've already created "{existingStore.store_name}"
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button 
                onClick={() => navigate(`/store/${existingStore.id}`)}
                className="w-full"
              >
                View My Store
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/seller-dashboard")}
                className="w-full"
              >
                Go to Seller Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Store</h1>
          <p className="text-muted-foreground">
            Set up your branded store to showcase all your products in one place
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Details
            </CardTitle>
            <CardDescription>
              Fill in the details for your store. Products you add will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Upload */}
              <div className="space-y-2">
                <Label>Store Banner (Optional)</Label>
                <div 
                  className="w-full h-32 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative"
                  style={bannerPreview ? { backgroundImage: `url(${bannerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  {!bannerPreview && (
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Upload banner image</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Recommended: 1200x300 pixels</p>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Store Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="max-w-[200px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 200x200 pixels
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Name */}
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="Enter your store name"
                  required
                  maxLength={100}
                />
              </div>

              {/* Hall Number */}
              <div className="space-y-2">
                <Label htmlFor="hall">Hall Number *</Label>
                <select
                  id="hall"
                  value={formData.hall}
                  onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select your hall</option>
                  <option value="Hall 1">Hall 1</option>
                  <option value="Hall 2">Hall 2</option>
                  <option value="Hall 3">Hall 3</option>
                  <option value="Hall 4">Hall 4</option>
                  <option value="Hall 5">Hall 5</option>
                  <option value="Hall 6">Hall 6</option>
                  <option value="Hall 7">Hall 7</option>
                  <option value="Hall 8">Hall 8</option>
                  <option value="Hall 9">Hall 9</option>
                </select>
              </div>

              {/* Bank Name */}
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Enter your bank name"
                  required
                />
              </div>

              {/* Bank Account Number */}
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder="Enter your account number"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell customers about your store..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating Store..." : "Create My Store"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">What happens next?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Your store page will be created with a unique link</li>
            <li>• Products you add will appear on your store page by category</li>
            <li>• Customers can browse your store and see all your products</li>
            <li>• Your store name will be shown on your product listings</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CreateStore;
