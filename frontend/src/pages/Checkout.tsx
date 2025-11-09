import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload, MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Medicine {
  id: string;
  name: string;
  price: number;
  requires_prescription: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionVerified, setPrescriptionVerified] = useState<{
    verified: boolean;
    confidence: number;
    doctorName?: string;
    details: string;
  } | null>(null);
  const [address, setAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [notes, setNotes] = useState("");

  // Mock medicines data (same as Dashboard and Cart)
  const medicines: Medicine[] = [
    { id: "1", name: "Paracetamol 500mg", price: 45.00, requires_prescription: false },
    { id: "2", name: "Amoxicillin 500mg", price: 120.00, requires_prescription: true },
    { id: "3", name: "Cetirizine 10mg", price: 35.00, requires_prescription: false },
    { id: "4", name: "Ibuprofen 400mg", price: 55.00, requires_prescription: false },
    { id: "5", name: "Omeprazole 20mg", price: 85.00, requires_prescription: true },
    { id: "6", name: "Vitamin D3 1000IU", price: 150.00, requires_prescription: false },
    { id: "7", name: "Aspirin 75mg", price: 40.00, requires_prescription: false },
    { id: "8", name: "Metformin 500mg", price: 95.00, requires_prescription: true },
  ];

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate("/auth");
      return;
    }
    
    // Check if cart is empty
    const cart = getCartItems();
    if (Object.keys(cart).length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
    }
  }, [navigate]);

  const getCartItems = () => {
    return authService.getUserCart();
  };

  const getCartItemsWithDetails = () => {
    const cart = getCartItems();
    return Object.entries(cart)
      .map(([medicineId, quantity]) => {
        const medicine = medicines.find(m => m.id === medicineId);
        if (!medicine) return null;
        return { medicine, quantity: quantity as number };
      })
      .filter(item => item !== null) as { medicine: Medicine; quantity: number }[];
  };

  const requiresPrescription = getCartItemsWithDetails().some(
    item => item.medicine.requires_prescription
  );

  const calculateTotal = () => {
    const items = getCartItemsWithDetails();
    return items.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPrescriptionFile(file);
      setPrescriptionVerified(null); // Reset verification when new file is selected
      
      // Show preview of selected file
      toast.info(`Selected: ${file.name}`, {
        description: "Click 'Verify Prescription' to check signature"
      });
    }
  };

  const handleVerifyPrescription = async () => {
    if (!prescriptionFile) {
      toast.error("Please select a prescription image first");
      return;
    }

    setVerifying(true);
    
    try {
      // Create a temporary order ID for verification
      const tempOrderId = `TEMP${Date.now()}`;
      
      toast.info("🔍 Verifying prescription signature with ML...", {
        description: "This may take a few seconds"
      });

      const result = await authService.uploadPrescription(tempOrderId, prescriptionFile);
      
      setPrescriptionVerified({
        verified: result.verified,
        confidence: result.confidence,
        doctorName: result.doctorName,
        details: result.details,
      });

      if (result.verified) {
        toast.success("✅ Prescription Verified!", {
          description: `Signature matched ${result.doctorName} with ${result.confidence}% confidence`
        });
      } else {
        toast.error("❌ Prescription Rejected", {
          description: result.details
        });
      }
    } catch (error: any) {
      console.error("Error verifying prescription:", error);
      toast.error("Verification failed", {
        description: error.message || "Could not verify prescription"
      });
      setPrescriptionVerified({
        verified: false,
        confidence: 0,
        details: error.message || "Verification failed"
      });
    } finally {
      setVerifying(false);
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

    if (requiresPrescription && !prescriptionVerified) {
      toast.error("Please verify your prescription first");
      return;
    }

    if (requiresPrescription && !prescriptionVerified.verified) {
      toast.error("Your prescription was rejected. Only verified prescriptions can be used.", {
        description: prescriptionVerified.details
      });
      return;
    }

    setLoading(true);

    try {
      const user = authService.getUser();
      if (!user) throw new Error("Not authenticated");

      const cartItems = getCartItemsWithDetails();
      
      // Create order via MongoDB API
      const orderData = {
        items: cartItems.map(item => ({
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          quantity: item.quantity,
          price: item.medicine.price,
        })),
        totalAmount: calculateTotal(),
        deliveryAddress: {
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 || undefined,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        paymentMethod,
        customerNotes: notes || undefined,
      };

      const order = await authService.createOrder(orderData);

      // If prescription required, upload it for the real order
      if (requiresPrescription && prescriptionFile) {
        await authService.uploadPrescription(order.orderId, prescriptionFile);
      }

      // Clear user cart
      authService.clearUserCart();

      toast.success("🎉 Order placed successfully!", {
        description: prescriptionVerified?.verified 
          ? `Prescription verified by ${prescriptionVerified.doctorName}` 
          : undefined
      });
      navigate("/orders");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const cartItems = getCartItemsWithDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/cart")} className="mb-4 hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order and get medicines delivered fast</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className="text-sm font-medium text-gray-700">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="House no., Building name"
                    className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2" className="text-sm font-medium text-gray-700">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Street, Area"
                    className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">City *</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">State *</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode *</Label>
                  <Input
                    id="pincode"
                    placeholder="000000"
                    className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prescription Upload with ML Verification */}
            {requiresPrescription && (
              <Card className="border-2 border-orange-200 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
                <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100 border-b border-orange-200">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-orange-600" />
                    </div>
                    Upload Prescription (Required)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="prescription" className="text-sm font-medium text-gray-700">
                      Prescription Image with Doctor's Signature
                    </Label>
                    <Input
                      id="prescription"
                      type="file"
                      accept="image/*"
                      className="h-12 border-gray-300 cursor-pointer"
                      onChange={handleFileChange}
                      disabled={verifying || loading}
                    />
                    {prescriptionFile && (
                      <p className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                        📄 Selected: {prescriptionFile.name}
                      </p>
                    )}
                  </div>

                  {prescriptionFile && !prescriptionVerified && (
                    <Button 
                      onClick={handleVerifyPrescription}
                      disabled={verifying}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                    >
                      {verifying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verifying with ML...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify Prescription
                        </>
                      )}
                    </Button>
                  )}

                  {prescriptionVerified && (
                    <Alert className={prescriptionVerified.verified ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                      {prescriptionVerified.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <AlertTitle className={prescriptionVerified.verified ? "text-green-800" : "text-red-800"}>
                        {prescriptionVerified.verified ? "✅ Verified" : "❌ Rejected"}
                      </AlertTitle>
                      <AlertDescription className={prescriptionVerified.verified ? "text-green-700" : "text-red-700"}>
                        {prescriptionVerified.verified ? (
                          <>
                            <strong>Doctor:</strong> {prescriptionVerified.doctorName}<br />
                            <strong>Confidence:</strong> {prescriptionVerified.confidence}%<br />
                            <span className="text-sm">{prescriptionVerified.details}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">{prescriptionVerified.details}</span><br />
                            <span className="text-xs mt-1 block">Please upload a prescription with a verified doctor's signature.</span>
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">ML Signature Verification</AlertTitle>
                    <AlertDescription className="text-xs text-blue-700">
                      Our system uses Machine Learning to verify doctor signatures. 
                      Only prescriptions with verified signatures (85%+ match) will be accepted.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    💳
                  </div>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer font-medium">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer font-medium">Online Payment</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    📝
                  </div>
                  Order Notes (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Any special instructions for delivery..."
                  className="border-gray-300 focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-b">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 mb-3">Items ({cartItems.length})</h4>
                  {cartItems.map((item) => (
                    <div key={item.medicine.id} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{item.medicine.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-blue-600">₹{(item.medicine.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-800">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (Included)</span>
                    <span className="font-medium text-gray-800">₹0.00</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ₹{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all" 
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500 mt-3">
                    By placing order, you agree to our terms & conditions
                  </p>
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
