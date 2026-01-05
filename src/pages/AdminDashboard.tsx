import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Users, Package, Ban, Home, CheckCircle, XCircle, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Store Settings Component
const StoreSettings = () => {
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "store_enabled")
      .maybeSingle();

    if (data?.value && typeof data.value === 'object' && 'enabled' in data.value) {
      setStoreEnabled((data.value as any).enabled);
    }
    setLoading(false);
  };

  const toggleStoreEnabled = async () => {
    const newValue = !storeEnabled;
    
    const { error } = await supabase
      .from("app_settings")
      .update({ value: { enabled: newValue } })
      .eq("key", "store_enabled");

    if (error) {
      toast.error("Failed to update settings");
      return;
    }

    setStoreEnabled(newValue);
    toast.success(newValue ? "Store feature enabled" : "Store feature disabled");
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Store Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Enable Store Feature</p>
            <p className="text-sm text-muted-foreground">
              When disabled, users cannot create new stores
            </p>
          </div>
          <Switch checked={storeEnabled} onCheckedChange={toggleStoreEnabled} />
        </div>
      </CardContent>
    </Card>
  );
};

interface Profile {
  user_id: string;
  shop_name: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  hall: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  seller_id: string;
  is_active: boolean;
  profiles: { shop_name: string | null; email: string };
}

interface Order {
  id: string;
  user_id: string;
  items: any[];
  delivery_info: any;
  total: number;
  status: string;
  created_at: string;
  profiles: { email: string; shop_name: string | null };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banReason, setBanReason] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadData();
    } catch (error: any) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [sellersData, productsData, ordersData] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*, profiles(shop_name, email)").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false })
    ]);

    if (sellersData.data) setSellers(sellersData.data);
    if (productsData.data) setProducts(productsData.data);
    if (ordersData.data) {
      // Fetch profile data for each order
      const ordersWithProfiles = await Promise.all(
        ordersData.data.map(async (order) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, shop_name")
            .eq("user_id", order.user_id)
            .single();
          
          return {
            ...order,
            profiles: profile || { email: "Unknown", shop_name: null },
          };
        })
      );
      setOrders(ordersWithProfiles as any);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!banReason.trim()) {
      toast.error("Please provide a ban reason");
      return;
    }

    try {
      const { error: banError } = await supabase
        .from("profiles")
        .update({
          is_banned: true,
          ban_reason: banReason,
          banned_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (banError) throw banError;

      const { error: productsError } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("seller_id", userId);

      if (productsError) throw productsError;

      toast.success("User banned and their products unlisted");
      setBanReason("");
      setSelectedSeller(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error banning user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("User unbanned successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error unbanning user");
    }
  };

  const clearAllProducts = async () => {
    if (!confirm("Are you sure you want to delete ALL products? This cannot be undone!")) {
      return;
    }

    try {
      const { error } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (error) throw error;
      
      toast.success("All products have been deleted");
      localStorage.removeItem("products");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error deleting products");
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "approved" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order approved successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error approving order");
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Order rejected");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error rejecting order");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Link to="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sellers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sellers.filter(s => s.is_banned).length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.filter(o => o.status === "pending_admin_approval").length === 0 ? (
                    <p className="text-muted-foreground">No pending orders</p>
                  ) : (
                    orders
                      .filter(o => o.status === "pending_admin_approval")
                      .map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm">
                              Customer: {order.profiles.email}
                            </p>
                            <p className="text-sm">
                              Total: ${order.total.toFixed(2)}
                            </p>
                            <div className="text-sm">
                              <p className="font-semibold">Items:</p>
                              <ul className="list-disc list-inside">
                                {order.items.map((item: any, idx: number) => (
                                  <li key={idx}>
                                    {item.title} x {item.quantity} - ${item.price}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="text-sm">
                              <p className="font-semibold">Delivery Info:</p>
                              <p>{order.delivery_info.fullName}</p>
                              <p>{order.delivery_info.phone}</p>
                              <p>{order.delivery_info.address}</p>
                              <p>
                                {order.delivery_info.city}, {order.delivery_info.postalCode}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                onClick={() => handleApproveOrder(order.id)}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve Order
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectOrder(order.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Order
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management - All Registration Details</CardTitle>
              </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sellers.map((seller) => (
                <div key={seller.user_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{seller.full_name || "No name provided"}</p>
                      <p className="text-sm text-muted-foreground">{seller.email}</p>
                      {seller.shop_name && (
                        <p className="text-sm font-medium text-primary mt-1">
                          Shop: {seller.shop_name}
                        </p>
                      )}
                      {seller.is_banned && (
                        <p className="text-sm text-destructive mt-1">
                          Banned: {seller.ban_reason}
                        </p>
                      )}
                    </div>
                    {!seller.is_banned ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setSelectedSeller(seller.user_id)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Ban User
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(seller.user_id)}
                      >
                        Unban User
                      </Button>
                    )}
                  </div>

                  {/* Full User Details */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg text-sm">
                    <div>
                      <p className="font-semibold text-muted-foreground">Phone</p>
                      <p>{seller.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Address</p>
                      <p>{seller.address || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">City</p>
                      <p>{seller.city || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">State</p>
                      <p>{seller.state || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Postal Code</p>
                      <p>{seller.postal_code || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Hall</p>
                      <p className="font-bold text-primary">{seller.hall || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Registered</p>
                      <p>{new Date(seller.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Show seller's products */}
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Listed Products:</p>
                    <div className="space-y-2">
                      {products
                        .filter(p => p.seller_id === seller.user_id)
                        .map(product => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-background border rounded">
                            <span className="text-sm">{product.title}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const newTitle = prompt("Edit product title:", product.title);
                                  if (newTitle && newTitle !== product.title) {
                                    const { error } = await supabase
                                      .from("products")
                                      .update({ title: newTitle })
                                      .eq("id", product.id);
                                    if (!error) {
                                      toast.success("Product updated");
                                      loadData();
                                    }
                                  }
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  if (confirm(`Delete "${product.title}"?`)) {
                                    const { error } = await supabase
                                      .from("products")
                                      .delete()
                                      .eq("id", product.id);
                                    if (!error) {
                                      toast.success("Product deleted");
                                      loadData();
                                    }
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      {products.filter(p => p.seller_id === seller.user_id).length === 0 && (
                        <p className="text-sm text-muted-foreground">No products listed</p>
                      )}
                    </div>
                  </div>

                  {selectedSeller === seller.user_id && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label htmlFor={`ban-reason-${seller.user_id}`}>Ban Reason</Label>
                        <Textarea
                          id={`ban-reason-${seller.user_id}`}
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Enter reason for banning this user..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleBanUser(seller.user_id)}>
                          Confirm Ban
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setSelectedSeller(null);
                          setBanReason("");
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>All Products Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Seller: {product.profiles?.shop_name || product.profiles?.email || "Unknown"}
                          </p>
                          <p className="text-sm mt-1">
                            Status: <span className={product.is_active ? "text-green-600" : "text-red-600"}>
                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newTitle = prompt("Edit product title:", product.title);
                              if (newTitle && newTitle !== product.title) {
                                const { error } = await supabase
                                  .from("products")
                                  .update({ title: newTitle })
                                  .eq("id", product.id);
                                if (!error) {
                                  toast.success("Product updated");
                                  loadData();
                                } else {
                                  toast.error("Failed to update product");
                                }
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={product.is_active ? "secondary" : "default"}
                            onClick={async () => {
                              const { error } = await supabase
                                .from("products")
                                .update({ is_active: !product.is_active })
                                .eq("id", product.id);
                              if (!error) {
                                toast.success(product.is_active ? "Product deactivated" : "Product activated");
                                loadData();
                              }
                            }}
                          >
                            {product.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (confirm(`Delete "${product.title}"?`)) {
                                const { error } = await supabase
                                  .from("products")
                                  .delete()
                                  .eq("id", product.id);
                                if (!error) {
                                  toast.success("Product deleted");
                                  loadData();
                                } else {
                                  toast.error("Failed to delete product");
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No products found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <StoreSettings />
          </TabsContent>

          <TabsContent value="danger">
            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={clearAllProducts}>
                  Delete All Products
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
