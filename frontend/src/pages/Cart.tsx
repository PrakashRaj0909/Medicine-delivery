import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, CreditCard, Package2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Medicine {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  requires_prescription: boolean;
  stock: number;
}

interface CartItem {
  medicineId: string;
  quantity: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // Expanded medicines data with more products
  const medicines: Medicine[] = [
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
    }
  ];

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate("/auth");
      return;
    }
    
    loadCart();
  }, [navigate]);

  const loadCart = () => {
    try {
      const userCart = authService.getUserCart();
      setCartItems(userCart);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (medicineId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = {
      ...cartItems,
      [medicineId]: newQuantity
    };
    
    setCartItems(updatedCart);
    authService.setUserCart(updatedCart);
  };

  const removeItem = (medicineId: string) => {
    const updatedCart = { ...cartItems };
    delete updatedCart[medicineId];
    
    setCartItems(updatedCart);
    authService.setUserCart(updatedCart);
    toast.success("Item removed from cart");
  };

  const getCartItemsWithDetails = () => {
    return Object.entries(cartItems)
      .map(([medicineId, quantity]) => {
        const medicine = medicines.find(m => m.id === medicineId);
        if (!medicine) return null;
        return { medicine, quantity };
      })
      .filter(item => item !== null) as { medicine: Medicine; quantity: number }[];
  };

  const calculateTotal = () => {
    const items = getCartItemsWithDetails();
    return items.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
  };

  const requiresPrescription = getCartItemsWithDetails().some(
    item => item.medicine.requires_prescription
  );

  const handleCheckout = () => {
    const items = getCartItemsWithDetails();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10 flex items-center justify-center">
        <div className="animate-pulse">Loading cart...</div>
      </div>
    );
  }

  const cartItemsWithDetails = getCartItemsWithDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")} 
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Shopping Cart
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Package2 className="w-4 h-4" />
                {cartItemsWithDetails.length} {cartItemsWithDetails.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
        </div>

        {cartItemsWithDetails.length === 0 ? (
          <Card className="text-center py-16 border-0 shadow-2xl bg-white">
            <CardContent>
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <CardTitle className="mb-3 text-2xl">Your cart is empty</CardTitle>
              <p className="text-gray-500 mb-6">Add some medicines to get started</p>
              <Button 
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Browse Medicines
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItemsWithDetails.map(({ medicine, quantity }) => (
                <Card key={medicine.id} className="hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500" />
                  
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Medicine Image */}
                      <div className="w-28 h-28 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl flex items-center justify-center overflow-hidden shadow-md">
                        <ShoppingBag className="w-12 h-12 text-purple-400" />
                      </div>
                      
                      {/* Medicine Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 mb-1">{medicine.name}</h3>
                            <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0">
                              {medicine.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(medicine.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </Button>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{medicine.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                              ₹{medicine.price.toFixed(2)}
                            </p>
                            {medicine.requires_prescription && (
                              <Badge className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                                Rx Required
                              </Badge>
                            )}
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(medicine.id, quantity - 1)}
                              disabled={quantity <= 1}
                              className="h-10 w-10 rounded-lg hover:bg-purple-100"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-14 text-center font-bold text-xl">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(medicine.id, quantity + 1)}
                              className="h-10 w-10 rounded-lg hover:bg-purple-100"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary - Enhanced */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-0 shadow-2xl bg-white overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500" />
                
                <CardHeader className="bg-gradient-to-br from-pink-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                    Order Summary
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Subtotal ({cartItemsWithDetails.length} items)</span>
                      <span className="font-semibold text-gray-800">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between text-base pb-4 border-b-2 border-dashed">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-semibold text-green-600">-₹0.00</span>
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                      <span className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-purple-600">Inclusive of all taxes</p>
                  </div>
                  
                  {/* Prescription Notice */}
                  {requiresPrescription && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                      <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Prescription required for some items
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        You'll need to upload a valid prescription during checkout
                      </p>
                    </div>
                  )}
                  
                  {/* Checkout Button */}
                  <Button 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1" 
                    onClick={handleCheckout}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </Button>

                  {/* Trust Badges */}
                  <div className="pt-4 border-t space-y-2">
                    <p className="text-xs text-gray-500 text-center">🔒 Secure Payment</p>
                    <p className="text-xs text-gray-500 text-center">🚚 Fast Delivery</p>
                    <p className="text-xs text-gray-500 text-center">✓ 100% Genuine Medicines</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
