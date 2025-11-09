import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, Eye } from "lucide-react";
import OrderTracking from "@/components/OrderTracking";
import { toast } from "sonner";

interface Order {
  orderId: string;
  _id?: string;
  orderStatus: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: any[];
  deliveryAddress: any;
  deliveryPartnerId?: string;
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      navigate("/auth");
      return;
    }
    
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const apiOrders = await authService.fetchOrders();
      setOrders(apiOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your medicine orders</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <CardTitle className="mb-2">No Orders Yet</CardTitle>
              <CardDescription className="mb-4">
                Start ordering medicines to see your orders here
              </CardDescription>
              <Button onClick={() => navigate("/dashboard")}>
                Browse Medicines
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.orderId} className="hover:shadow-card transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">
                        Order #{order.orderId}
                      </CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.orderStatus)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus.replace("_", " ").toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Items:</p>
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="font-medium">
                          {item.medicineName} x {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      ))}
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Delivery Address:</p>
                      <p className="font-medium">
                        {order.deliveryAddress.addressLine1}
                        {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
                        <br />
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                        <p className="text-sm font-medium uppercase">{order.paymentMethod}</p>
                      </div>
                      {['accepted', 'picked', 'on_the_way'].includes(order.orderStatus) && order.deliveryPartnerId && (
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedOrder(order.orderId)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Track Live
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Live Tracking Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder} - Live Tracking</DialogTitle>
            </DialogHeader>
            {selectedOrder && <OrderTracking orderId={selectedOrder} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Orders;
