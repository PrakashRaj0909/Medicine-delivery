import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  medicine_id: string;
  quantity: number;
  price: number;
  requires_prescription: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [address, setAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [notes, setNotes] = useState("");

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
          medicine_id,
          quantity,
          medicine:medicines (
            price,
            requires_prescription
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      
      const items = data.map((item: any) => ({
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        price: item.medicine.price,
        requires_prescription: item.medicine.requires_prescription,
      }));
      
      setCartItems(items);
      
      if (items.length === 0) {
        toast.error("Your cart is empty");
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart items");
    }
  };

  const requiresPrescription = cartItems.some(item => item.requires_prescription);

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.addressLine1 || !address.city || !address.state || !address.pincode) {
      toast.error("Please fill in all address fields");
      return;
    }

    if (requiresPrescription && !prescriptionFile) {
      toast.error("Please upload a prescription");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create address
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          address_line1: address.addressLine1,
          address_line2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        })
        .select()
        .single();

      if (addressError) throw addressError;

      let prescriptionId = null;

      // Upload prescription if required
      if (requiresPrescription && prescriptionFile) {
        const fileExt = prescriptionFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        // Note: This is a placeholder. In production, you'd upload to storage
        const { data: prescriptionData, error: prescriptionError } = await supabase
          .from("prescriptions")
          .insert({
            user_id: user.id,
            image_url: fileName, // Placeholder
          })
          .select()
          .single();

        if (prescriptionError) throw prescriptionError;
        prescriptionId = prescriptionData.id;
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          address_id: addressData.id,
          prescription_id: prescriptionId,
          total_amount: calculateTotal(),
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "pending" : "completed",
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        medicine_id: item.medicine_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearError) throw clearError;

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/cart")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    placeholder="House no., Building name"
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Street, Area"
                    value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="000000"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prescription Upload */}
            {requiresPrescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="prescription">
                      Prescription Image (Required)
                    </Label>
                    <Input
                      id="prescription"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    {prescriptionFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {prescriptionFile.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online">Online Payment</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any special instructions for delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({cartItems.length})</span>
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
                  
                  <Button 
                    className="w-full" 
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
