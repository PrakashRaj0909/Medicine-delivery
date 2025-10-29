import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Pill, Truck, Clock, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-secondary-light/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-6 shadow-glow animate-fade-in">
            <Pill className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 animate-fade-in">
            MediExpress
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            Your trusted medicine delivery partner. Fast, reliable, and secure delivery right to your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button size="lg" onClick={() => navigate("/auth?type=customer")} className="shadow-card">
              Order Medicines
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth?type=delivery_partner")}
              className="shadow-soft"
            >
              <Truck className="w-4 h-4 mr-2" />
              Become a Delivery Partner
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="hover:shadow-card transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Fast Delivery</CardTitle>
              <CardDescription>
                Get your medicines delivered within hours, not days
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-card transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Secure & Verified</CardTitle>
              <CardDescription>
                All prescriptions are verified for your safety
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-card transition-all duration-300 hover-scale">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Real-time Tracking</CardTitle>
              <CardDescription>
                Track your order in real-time with live updates
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 text-primary-foreground font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold mb-2">Browse Medicines</h3>
              <p className="text-sm text-muted-foreground">
                Search and select from our wide range of medicines
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 text-primary-foreground font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold mb-2">Upload Prescription</h3>
              <p className="text-sm text-muted-foreground">
                Upload your prescription if required
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 text-primary-foreground font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold mb-2">Place Order</h3>
              <p className="text-sm text-muted-foreground">
                Complete checkout with your delivery address
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4 text-primary-foreground font-bold text-xl">
                4
              </div>
              <h3 className="font-semibold mb-2">Track & Receive</h3>
              <p className="text-sm text-muted-foreground">
                Track in real-time and receive at your doorstep
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
