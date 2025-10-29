import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  quantity: number;
  medicine: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    requires_prescription: boolean;
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          medicine:medicines (
            id,
            name,
            price,
            image_url,
            requires_prescription
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", cartItemId);

      if (error) throw error;
      
      setCartItems(prev =>
        prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);

      if (error) throw error;
      
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const medicine = item.medicine as any;
      return sum + (medicine.price * item.quantity);
    }, 0);
  };

  const requiresPrescription = cartItems.some(
    item => (item.medicine as any).requires_prescription
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <CardTitle className="mb-2">Your cart is empty</CardTitle>
              <p className="text-muted-foreground mb-4">Add some medicines to get started</p>
              <Button onClick={() => navigate("/dashboard")}>Browse Medicines</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const medicine = item.medicine as any;
                return (
                  <Card key={item.id} className="hover:shadow-card transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {medicine.image_url ? (
                            <img
                              src={medicine.image_url}
                              alt={medicine.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{medicine.name}</h3>
                          <p className="text-2xl font-bold text-primary mb-2">
                            ₹{medicine.price.toFixed(2)}
                          </p>
                          {medicine.requires_prescription && (
                            <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                              Prescription Required
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium">Free</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    
                    {requiresPrescription && (
                      <p className="text-xs text-muted-foreground mb-4">
                        * This order requires prescription upload during checkout
                      </p>
                    )}
                    
                    <Button className="w-full" onClick={handleCheckout}>
                      Proceed to Checkout
                    </Button>
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
