import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Truck, Search, LogOut, MapPin, Clock, CheckCircle, Package, DollarSign, TrendingUp, Star, Navigation } from "lucide-react";

interface Order {
  orderId: string;
  _id?: string;
  customerId?: string;
  deliveryPartnerId?: string;
  orderStatus: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: any[];
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate("/auth");
      return;
    }
    
    const currentUser = authService.getUser();
    
    // Redirect customers to customer dashboard
    if (currentUser?.userType === 'customer') {
      navigate("/dashboard");
      return;
    }
    
    setUser(currentUser);
    fetchAllOrders();
  }, [navigate]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const apiOrders = await authService.fetchOrders();
      setAllOrders(apiOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) return;

      // If accepting a pending order, assign it to this delivery partner
      if (newStatus === 'accepted') {
        try {
          await authService.assignOrder(orderId);
          toast.success("Order accepted successfully!");
          
          // Start tracking location for this order
          startLocationTracking(orderId);
        } catch (error: any) {
          toast.error(error.message || "Failed to accept order");
          fetchAllOrders();
          return;
        }
      } else {
        // Update the order status
        try {
          await authService.updateOrderStatusAPI(orderId, newStatus);
          toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
        } catch (error: any) {
          toast.error(error.message || "Failed to update order status");
          fetchAllOrders();
          return;
        }
      }

      // Refresh orders list
      fetchAllOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Location tracking for delivery partners
  const startLocationTracking = (orderId: string) => {
    if ('geolocation' in navigator) {
      // Request permission and start tracking
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Initial location update
          updateLocationOnServer(orderId, position.coords.latitude, position.coords.longitude);
          
          // Start watching location
          const watchId = navigator.geolocation.watchPosition(
            (position) => {
              updateLocationOnServer(orderId, position.coords.latitude, position.coords.longitude);
            },
            (error) => {
              console.error('Location error:', error);
              toast.error('Unable to access location. Please enable location services.');
            },
            {
              enableHighAccuracy: true,
              maximumAge: 10000,
              timeout: 5000
            }
          );

          // Store watchId to stop tracking later if needed
          localStorage.setItem(`locationWatch_${orderId}`, watchId.toString());
          toast.success("Location tracking started!");
        },
        (error) => {
          console.error('Initial location error:', error);
          toast.error('Please enable location services to accept orders.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const updateLocationOnServer = async (orderId: string, latitude: number, longitude: number) => {
    try {
      await authService.updateDeliveryLocation(orderId, latitude, longitude);
      const user = authService.getUser();
      console.log(`✅ [${user?.name}] Location updated for order ${orderId}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (error) {
      console.error(`❌ [${orderId}] Error updating location:`, error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "accepted":
      case "picked":
        return <Package className="w-4 h-4" />;
      case "on_the_way":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
      case "picked":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "on_the_way":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      "pending": "accepted",
      "accepted": "picked",
      "picked": "on_the_way",
      "on_the_way": "delivered"
    };
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  const filteredOrders = allOrders.filter(order => {
    // Safely handle search with optional chaining and default values
    const orderId = order.orderId || '';
    const city = order.deliveryAddress?.city || '';
    
    const matchesSearch = orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         city.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = false;
    
    if (filterStatus === "all") {
      matchesStatus = true;
    } else if (filterStatus === "pending") {
      // Show unassigned pending orders
      matchesStatus = order.orderStatus === "pending" && !order.deliveryPartnerId;
    } else if (filterStatus === "accepted") {
      // Show only my active orders
      matchesStatus = ["accepted", "picked", "on_the_way"].includes(order.orderStatus) && 
                     order.deliveryPartnerId === user?.id;
    } else if (filterStatus === "delivered") {
      // Show only my delivered orders
      matchesStatus = order.orderStatus === "delivered" && order.deliveryPartnerId === user?.id;
    }
    
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.orderStatus === "pending" && !o.deliveryPartnerId).length,
    myActive: allOrders.filter(o => 
      ["accepted", "picked", "on_the_way"].includes(o.orderStatus) && 
      o.deliveryPartnerId === user?.id
    ).length,
    myDelivered: allOrders.filter(o => 
      o.orderStatus === "delivered" && 
      o.deliveryPartnerId === user?.id
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Delivery Partner Portal
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Welcome, <span className="font-semibold">{user?.name}</span>!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/")} className="hover:bg-blue-50">
                Home
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-red-50 hover:text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Enhanced Stats Cards with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-orange-600 font-medium">Available Orders</CardDescription>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold text-orange-700">{orderStats.pending}</CardTitle>
              <p className="text-xs text-orange-600 mt-1">Waiting for pickup</p>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-blue-600 font-medium">My Active Deliveries</CardDescription>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold text-blue-700">{orderStats.myActive}</CardTitle>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                In progress
              </p>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-green-600 font-medium">Completed Today</CardDescription>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold text-green-700">{orderStats.myDelivered}</CardTitle>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 fill-green-600" />
                Great work!
              </p>
            </CardHeader>
          </Card>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by order ID or city..."
              className="pl-12 h-12 border-gray-200 focus:ring-2 focus:ring-blue-500 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              className={filterStatus === "all" ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md" : "hover:bg-blue-50"}
            >
              All Orders
            </Button>
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus("pending")}
              className={filterStatus === "pending" ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-md" : "hover:bg-orange-50"}
            >
              Available ({orderStats.pending})
            </Button>
            <Button
              variant={filterStatus === "accepted" ? "default" : "outline"}
              onClick={() => setFilterStatus("accepted")}
              className={filterStatus === "accepted" ? "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md" : "hover:bg-blue-50"}
            >
              My Active ({orderStats.myActive})
            </Button>
            <Button
              variant={filterStatus === "delivered" ? "default" : "outline"}
              onClick={() => setFilterStatus("delivered")}
              className={filterStatus === "delivered" ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-md" : "hover:bg-green-50"}
            >
              Completed ({orderStats.myDelivered})
            </Button>
          </div>
        </div>

        {/* Enhanced Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse border-0 shadow-md">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded-lg w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded-lg w-1/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded-lg w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="text-center py-16 border-0 shadow-xl bg-white">
            <CardContent>
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <CardTitle className="mb-2 text-2xl">No Orders Found</CardTitle>
              <CardDescription className="text-base">
                {searchQuery || filterStatus !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "No orders available at the moment. Check back soon!"}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => (
              <Card key={order.orderId} className="hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2 flex items-center gap-2">
                        <span className="text-blue-600">#{order.orderId}</span>
                        {order.deliveryPartnerId === user?.id && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                            <Star className="w-3 h-3 mr-1 fill-white" />
                            Assigned to You
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.orderStatus)} border-0 px-4 py-2 text-sm font-medium`}>
                      <span className="flex items-center gap-2">
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus.replace("_", " ").toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500 mb-2 font-medium">Order Items</p>
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-2">
                            <span className="font-medium text-gray-700">{item.medicineName}</span>
                            <Badge variant="outline" className="bg-white">x{item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-600 mb-1 font-medium">Payment Method</p>
                        <p className="font-bold text-blue-700 uppercase text-lg">{order.paymentMethod}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-sm text-green-600 mb-2 flex items-center gap-1 font-medium">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </p>
                        <p className="font-medium text-gray-700 leading-relaxed">
                          {order.deliveryAddress.addressLine1}
                          {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                          <br />
                          <span className="text-blue-600">{order.deliveryAddress.city}</span>, {order.deliveryAddress.state}
                          <br />
                          <span className="font-bold">PIN: {order.deliveryAddress.pincode}</span>
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                        <p className="text-sm text-purple-600 mb-1 font-medium">Total Amount</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ₹{order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Action Buttons */}
                  {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                    <div className="flex gap-3 border-t pt-4">
                      {getNextStatus(order.orderStatus) && (
                        <Button
                          onClick={() => updateOrderStatus(order.orderId, getNextStatus(order.orderStatus)!)}
                          className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-base font-medium"
                        >
                          {order.orderStatus === "pending" && (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Accept Order
                            </>
                          )}
                          {order.orderStatus === "accepted" && (
                            <>
                              <Package className="w-5 h-5 mr-2" />
                              Mark as Picked
                            </>
                          )}
                          {order.orderStatus === "picked" && (
                            <>
                              <Navigation className="w-5 h-5 mr-2" />
                              Start Delivery
                            </>
                          )}
                          {order.orderStatus === "on_the_way" && (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Mark as Delivered
                            </>
                          )}
                        </Button>
                      )}
                      {order.orderStatus === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => updateOrderStatus(order.orderId, "cancelled")}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 h-12"
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryDashboard;
