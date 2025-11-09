import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Pill, Truck, Clock, Shield, Star, CheckCircle, ArrowRight, Zap, Users, Package } from "lucide-react";
import { useState, useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Clock, title: "Fast Delivery", desc: "Medicines delivered in 30-60 minutes", color: "text-blue-600" },
    { icon: Shield, title: "100% Secure", desc: "Licensed pharmacies & verified products", color: "text-green-600" },
    { icon: Zap, title: "Easy Ordering", desc: "Order in 3 simple steps", color: "text-purple-600" },
  ];

  const stats = [
    { value: "50K+", label: "Happy Customers", icon: Users },
    { value: "99%", label: "On-Time Delivery", icon: CheckCircle },
    { value: "24/7", label: "Support Available", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                MediExpress
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate("/customer-login")}>
                Customer Login
              </Button>
              <Button variant="ghost" onClick={() => navigate("/delivery-login")}>
                <Truck className="w-4 h-4 mr-2" />
                Partner Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Trusted by 50,000+ customers
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Medicine Delivery
              </span>
              <br />
              <span className="text-gray-800">
                at Your Doorstep
              </span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Order medicines online and get them delivered within 30-60 minutes. 
              Fast, reliable, and secure healthcare at your fingertips.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/customer-login")}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Order Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/delivery-login")}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Truck className="w-5 h-5 mr-2" />
                Become a Partner
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Feature Showcase */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-3xl p-8 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white rounded-2xl p-8 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-6">
                  {features.map((feature, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl transition-all duration-500 cursor-pointer ${
                        activeFeature === idx
                          ? "bg-blue-50 border-2 border-blue-500 scale-105"
                          : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                      }`}
                      onClick={() => setActiveFeature(idx)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${activeFeature === idx ? 'bg-blue-500' : 'bg-gray-300'} flex items-center justify-center transition-colors duration-300`}>
                          <feature.icon className={`w-6 h-6 ${activeFeature === idx ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${activeFeature === idx ? 'text-blue-600' : 'text-gray-800'}`}>
                            {feature.title}
                          </h3>
                          <p className="text-sm text-gray-600">{feature.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get your medicines in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Browse Medicines", desc: "Search from 10,000+ medicines", icon: Package },
              { step: "2", title: "Upload Prescription", desc: "Optional for prescription medicines", icon: Shield },
              { step: "3", title: "Place Order", desc: "Secure checkout & payment", icon: CheckCircle },
              { step: "4", title: "Fast Delivery", desc: "Delivered in 30-60 minutes", icon: Truck },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <item.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose MediExpress?</h2>
          <p className="text-xl text-gray-600">Your health, our priority</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: Clock, title: "30-Minute Delivery", desc: "Lightning-fast delivery for urgent needs", color: "from-blue-500 to-blue-600" },
            { icon: Shield, title: "100% Genuine", desc: "All medicines sourced from licensed pharmacies", color: "from-green-500 to-green-600" },
            { icon: Zap, title: "Easy Returns", desc: "Hassle-free returns within 7 days", color: "from-purple-500 to-purple-600" },
            { icon: Users, title: "24/7 Support", desc: "Expert assistance anytime you need", color: "from-orange-500 to-orange-600" },
            { icon: CheckCircle, title: "Verified Products", desc: "Quality checked by certified pharmacists", color: "from-teal-500 to-teal-600" },
            { icon: Package, title: "Secure Packaging", desc: "Tamper-proof & temperature controlled", color: "from-pink-500 to-pink-600" },
          ].map((feature, idx) => (
            <Card key={idx} className="border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer">
              <CardHeader>
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-teal-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust MediExpress for their healthcare needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/customer-login")}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              Order Medicines Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/delivery-login")}
              className="border-2 border-white text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Truck className="w-5 h-5 mr-2" />
              Join as Partner
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">MediExpress</span>
              </div>
              <p className="text-gray-400">Your trusted medicine delivery partner</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Partners</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Become a Partner</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partner Benefits</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MediExpress. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
