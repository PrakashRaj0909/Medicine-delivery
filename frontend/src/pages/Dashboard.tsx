import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pill, Search, ShoppingCart, LogOut, Upload, Package, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [user, setUser] = useState(authService.getUser());
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [prescriptionFilter, setPrescriptionFilter] = useState<"all" | "prescription" | "non-prescription">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate("/auth");
      return;
    }
    
    const currentUser = authService.getUser();
    
    // Redirect delivery partners to delivery dashboard
    if (currentUser?.userType === 'delivery_partner') {
      navigate("/delivery-dashboard");
      return;
    }
    
    setUser(currentUser);
    
    // Load user-specific cart
    const userCart = authService.getUserCart();
    setCart(userCart);
    
    fetchMedicines();
  }, [navigate]);

  const fetchMedicines = async () => {
    try {
      // Expanded medicines data with more products
      const mockMedicines: Medicine[] = [
        {
          id: "1",
          name: "Paracetamol 500mg",
          description: "Pain reliever and fever reducer",
          category: "Pain Relief",
          price: 45.00,
          requires_prescription: false,
          stock: 100
        },
        {
          id: "2",
          name: "Amoxicillin 500mg",
          description: "Antibiotic for bacterial infections",
          category: "Antibiotics",
          price: 120.00,
          requires_prescription: true,
          stock: 50
        },
        {
          id: "3",
          name: "Cetirizine 10mg",
          description: "Antihistamine for allergies",
          category: "Allergy",
          price: 35.00,
          requires_prescription: false,
          stock: 80
        },
        {
          id: "4",
          name: "Ibuprofen 400mg",
          description: "Anti-inflammatory pain reliever",
          category: "Pain Relief",
          price: 55.00,
          requires_prescription: false,
          stock: 120
        },
        {
          id: "5",
          name: "Omeprazole 20mg",
          description: "Proton pump inhibitor for acid reflux",
          category: "Digestive Health",
          price: 85.00,
          requires_prescription: true,
          stock: 60
        },
        {
          id: "6",
          name: "Vitamin D3 1000IU",
          description: "Essential vitamin supplement",
          category: "Vitamins",
          price: 150.00,
          requires_prescription: false,
          stock: 200
        },
        {
          id: "7",
          name: "Aspirin 75mg",
          description: "Blood thinner and pain reliever",
          category: "Cardiovascular",
          price: 40.00,
          requires_prescription: false,
          stock: 90
        },
        {
          id: "8",
          name: "Metformin 500mg",
          description: "Diabetes medication",
          category: "Diabetes",
          price: 95.00,
          requires_prescription: true,
          stock: 70
        },
        {
          id: "9",
          name: "Azithromycin 500mg",
          description: "Antibiotic for respiratory infections",
          category: "Antibiotics",
          price: 180.00,
          requires_prescription: true,
          stock: 45
        },
        {
          id: "10",
          name: "Losartan 50mg",
          description: "Blood pressure medication",
          category: "Cardiovascular",
          price: 110.00,
          requires_prescription: true,
          stock: 65
        },
        {
          id: "11",
          name: "Montelukast 10mg",
          description: "Asthma and allergy medication",
          category: "Respiratory",
          price: 145.00,
          requires_prescription: true,
          stock: 55
        },
        {
          id: "12",
          name: "Clopidogrel 75mg",
          description: "Blood thinner for heart health",
          category: "Cardiovascular",
          price: 130.00,
          requires_prescription: true,
          stock: 40
        },
        {
          id: "13",
          name: "Multivitamin Tablets",
          description: "Daily multivitamin supplement",
          category: "Vitamins",
          price: 250.00,
          requires_prescription: false,
          stock: 150
        },
        {
          id: "14",
          name: "Calcium + Vitamin D",
          description: "Bone health supplement",
          category: "Vitamins",
          price: 180.00,
          requires_prescription: false,
          stock: 120
        },
        {
          id: "15",
          name: "Dolo 650mg",
          description: "Fever and pain relief",
          category: "Pain Relief",
          price: 50.00,
          requires_prescription: false,
          stock: 200
        },
        {
          id: "16",
          name: "Atorvastatin 10mg",
          description: "Cholesterol-lowering medication",
          category: "Cardiovascular",
          price: 125.00,
          requires_prescription: true,
          stock: 75
        },
        {
          id: "17",
          name: "Pantoprazole 40mg",
          description: "Treats stomach acid and ulcers",
          category: "Digestive Health",
          price: 90.00,
          requires_prescription: true,
          stock: 85
        },
        {
          id: "18",
          name: "Levothyroxine 50mcg",
          description: "Thyroid hormone replacement",
          category: "Hormones",
          price: 95.00,
          requires_prescription: true,
          stock: 60
        },
        {
          id: "19",
          name: "Vitamin C 500mg",
          description: "Immunity booster supplement",
          category: "Vitamins",
          price: 120.00,
          requires_prescription: false,
          stock: 180
        },
        {
          id: "20",
          name: "Zinc Tablets 50mg",
          description: "Essential mineral supplement",
          category: "Vitamins",
          price: 135.00,
          requires_prescription: false,
          stock: 160
        },
        {
          id: "21",
          name: "Salbutamol Inhaler",
          description: "Quick relief for asthma",
          category: "Respiratory",
          price: 220.00,
          requires_prescription: true,
          stock: 35
        },
        {
          id: "22",
          name: "Diclofenac 50mg",
          description: "Anti-inflammatory for pain",
          category: "Pain Relief",
          price: 65.00,
          requires_prescription: false,
          stock: 95
        },
        {
          id: "23",
          name: "Ranitidine 150mg",
          description: "Reduces stomach acid production",
          category: "Digestive Health",
          price: 75.00,
          requires_prescription: false,
          stock: 110
        },
        {
          id: "24",
          name: "Fluconazole 150mg",
          description: "Antifungal medication",
          category: "Antifungal",
          price: 155.00,
          requires_prescription: true,
          stock: 42
        }
      ];
      
      setMedicines(mockMedicines);
      setLoading(false);
    } catch (error: any) {
      toast.error("Failed to load medicines");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const addToCart = (medicineId: string) => {
    const currentCart = authService.getUserCart();
    const updatedCart = {
      ...currentCart,
      [medicineId]: (currentCart[medicineId] || 0) + 1
    };
    
    authService.setUserCart(updatedCart);
    setCart(updatedCart);
    
    toast.success("Added to cart!");
  };

  const filteredMedicines = medicines.filter(med => {
    // Search filter
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Prescription filter
    const matchesPrescription = 
      prescriptionFilter === "all" ||
      (prescriptionFilter === "prescription" && med.requires_prescription) ||
      (prescriptionFilter === "non-prescription" && !med.requires_prescription);
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || med.category === categoryFilter;
    
    return matchesSearch && matchesPrescription && matchesCategory;
  });

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Get unique categories
  const categories = Array.from(new Set(medicines.map(m => m.category)));

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
                <p className="text-sm text-muted-foreground">Welcome, {user?.name}!</p>
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
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-8 mb-8 border border-border/50 shadow-lg">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-3">
              Get Medicines Delivered to Your Doorstep 🚀
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Order prescription and OTC medicines with fast delivery. Upload prescription for validation.
            </p>
            <div className="flex gap-3">
              <Button size="lg" className="shadow-glow" onClick={() => toast.info("Upload feature coming soon!")}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Prescription
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('search-input')?.focus()}>
                Browse Medicines
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search for medicines, categories..."
              className="pl-12 h-14 text-lg shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Tabs and Category Select */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Tabs value={prescriptionFilter} onValueChange={(v: any) => setPrescriptionFilter(v)} className="flex-1">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="all">
                  All Medicines
                  <Badge variant="secondary" className="ml-2">
                    {medicines.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="prescription">
                  Prescription Only
                  <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                    {medicines.filter(m => m.requires_prescription).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="non-prescription">
                  Non-Prescription
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    {medicines.filter(m => !m.requires_prescription).length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(prescriptionFilter !== "all" || categoryFilter !== "all") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {prescriptionFilter !== "all" && (
                <Badge variant="outline" className="gap-2">
                  {prescriptionFilter === "prescription" ? "Prescription Required" : "Non-Prescription"}
                  <button onClick={() => setPrescriptionFilter("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge variant="outline" className="gap-2">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPrescriptionFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Medicines Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">
              {prescriptionFilter === "prescription" 
                ? "Prescription Medicines" 
                : prescriptionFilter === "non-prescription"
                ? "Over-the-Counter Medicines"
                : "Available Medicines"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Showing {filteredMedicines.length} of {medicines.length} medicines
            </p>
          </div>

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
                <Card key={medicine.id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{medicine.name}</CardTitle>
                      {medicine.requires_prescription && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Rx Required
                        </Badge>
                      )}
                      {!medicine.requires_prescription && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          OTC
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {medicine.category}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                      {medicine.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-primary">
                        ₹{medicine.price.toFixed(2)}
                      </span>
                      <Badge variant={medicine.stock > 50 ? "default" : medicine.stock > 0 ? "secondary" : "destructive"}>
                        {medicine.stock > 50 ? "In Stock" : medicine.stock > 0 ? `${medicine.stock} left` : "Out of Stock"}
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => addToCart(medicine.id)}
                      disabled={medicine.stock === 0}
                    >
                      {medicine.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredMedicines.length === 0 && (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground mb-2">No medicines found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
