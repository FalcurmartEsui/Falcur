import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    hall: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?checkout=true");
        return;
      }
      setUser(session.user);

      // Load saved user profile info
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, hall")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setFormData({
          fullName: profile.full_name || "",
          phone: profile.phone || "",
          hall: profile.hall || "",
        });
      }
    };

    loadUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login to continue");
      navigate("/auth?checkout=true");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      // Save user info to profile for future use
      await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          hall: formData.hall,
        })
        .eq("user_id", user.id);

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: user.id,
          items: items as any,
          delivery_info: formData as any,
          total: getTotalPrice(),
          status: "pending_admin_approval",
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create notifications for sellers
      const sellerIds = [...new Set(items.map(item => item.seller_id))];
      
      const notificationInserts = sellerIds.map(sellerId => ({
        order_id: order.id,
        seller_id: sellerId,
        is_read: false,
      }));

      await supabase.from("order_notifications").insert(notificationInserts);

      // Play notification sound
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjUxILTKXh8bllHAU2jdXwzn4yBSl+zPLaizsKGGS56+mjU=");
      audio.play();

      toast.success("Order placed successfully! Awaiting admin approval.");
      clearCart();
      navigate("/");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="bg-gradient-to-br from-background to-muted p-4 pt-24">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hall">Hall Number</Label>
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

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span>Total:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : "Receive Products"}
                  </Button>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg border">
                    <p className="text-center font-bold text-lg">
                      Products will be delivered to you in about a week.
                    </p>
                    <p className="text-center text-muted-foreground mt-2">
                      We will contact you via email and phone call with the information you provided.
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
