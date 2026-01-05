import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SellerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SellerModal = ({ isOpen, onClose }: SellerModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has a shop_name (is a seller)
      const { data: profile } = await supabase
        .from("profiles")
        .select("shop_name")
        .eq("user_id", data.user.id)
        .single();

      if (!profile?.shop_name) {
        toast({ 
          title: "Not a seller", 
          description: "This account is not registered as a seller.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        return;
      }

      toast({ title: "Login successful!" });
      navigate("/seller-dashboard");
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Login failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const shopName = formData.get("shopName") as string;
      const phone = formData.get("phone") as string;
      const hall = formData.get("hall") as string;
      const bankName = formData.get("bankName") as string;
      const bankAccountNumber = formData.get("bankAccountNumber") as string;

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Update profile with shop details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          shop_name: shopName,
          phone: phone,
          hall: hall,
          bank_name: bankName,
          bank_account_number: bankAccountNumber
        })
        .eq("user_id", authData.user.id);

      if (profileError) throw profileError;

      // Assign seller role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "seller"
        });

      if (roleError) {
        console.error("Role assignment error:", roleError);
        // Don't throw - user can still function with shop_name
      }

      toast({ title: "Seller account created successfully!" });
      navigate("/seller-dashboard");
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Registration failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Seller Portal</DialogTitle>
        </DialogHeader>
        
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 pb-3 font-semibold ${
              isLogin ? "border-b-2 border-black text-black" : "text-gray-500"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 pb-3 font-semibold ${
              !isLogin ? "border-b-2 border-black text-black" : "text-gray-500"
            }`}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Button type="submit" className="w-full bg-black hover:bg-black/90" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Input name="shopName" placeholder="Shop Name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="phone" type="tel" placeholder="Phone Number" required />
            <div>
              <label className="block text-sm font-semibold mb-2">Select Your Hall</label>
              <select 
                name="hall" 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Choose Hall Number</option>
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
            <Input name="bankName" placeholder="Bank Name" required />
            <Input name="bankAccountNumber" placeholder="Bank Account Number" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Textarea name="description" placeholder="Business Description (Optional)" />
            <Button type="submit" className="w-full bg-black hover:bg-black/90" disabled={loading}>
              {loading ? "Creating account..." : "Create Seller Account"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SellerModal;
