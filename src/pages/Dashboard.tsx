import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pill, Search, ShoppingCart, LogOut, Upload, Package } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  requires_prescription: boolean;
  stock: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name");

      if (error) throw error;
      setMedicines(data || []);
    } catch (error: any) {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const addToCart = async (medicineId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: user.id,
          medicine_id: medicineId,
          quantity: 1,
        }, {
          onConflict: "user_id,medicine_id",
        });

      if (error) throw error;
      
      setCart(prev => ({
        ...prev,
        [medicineId]: (prev[medicineId] || 0) + 1
      }));
      toast.success("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl shadow-glow">
                <Pill className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">MediExpress</h1>
                <p className="text-sm text-muted-foreground">Order medicines instantly</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
              >
                Home
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 px-2 py-0.5 bg-secondary">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/orders")}
              >
                <Package className="w-4 h-4 mr-2" />
                Orders
              </Button>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-8 mb-8 border border-border/50">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Get Medicines Delivered to Your Doorstep
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Order prescription and OTC medicines with fast delivery. Upload prescription for validation.
            </p>
            <div className="flex gap-3">
              <Button size="lg" className="shadow-glow" onClick={() => toast.info("Upload feature coming soon!")}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Prescription
              </Button>
              <Button size="lg" variant="outline">
                Browse Medicines
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for medicines, categories..."
              className="pl-12 h-14 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Medicines Grid */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-6">Available Medicines</h3>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded mb-4" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMedicines.map((medicine) => (
                <Card key={medicine.id} className="hover:shadow-card transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{medicine.name}</CardTitle>
                      {medicine.requires_prescription && (
                        <Badge variant="outline" className="bg-secondary/10">
                          Rx
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{medicine.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {medicine.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ₹{medicine.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => addToCart(medicine.id)}
                        disabled={medicine.stock === 0}
                      >
                        {medicine.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Stock: {medicine.stock} units
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No medicines found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
