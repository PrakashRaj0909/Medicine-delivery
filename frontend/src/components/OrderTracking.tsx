import { useEffect, useState } from "react";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, MapPin, Phone, Star, Truck, Navigation, Clock } from "lucide-react";

interface DeliveryLocation {
  deliveryPartner: {
    name: string;
    phone: string;
    vehicleType?: string;
    vehicleNumber?: string;
    rating?: { average: number; totalRatings: number };
  };
  location: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  } | null;
  orderStatus: string;
}

const OrderTracking = ({ orderId }: { orderId: string }) => {
  const [tracking, setTracking] = useState<DeliveryLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const data = await authService.getDeliveryLocation(orderId);
        setTracking(data);
        setError("");
      } catch (err: any) {
        console.error('Error fetching delivery location:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();

    // Poll location every 10 seconds for live updates
    const interval = setInterval(fetchLocation, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Tracking</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <p className="text-xs text-muted-foreground">
          This order may not have been assigned to a delivery partner yet.
        </p>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">No tracking data available</p>
      </div>
    );
  }

  const { deliveryPartner, location, orderStatus } = tracking;

  const openInGoogleMaps = () => {
    if (location) {
      window.open(
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Live Delivery Tracking
            </CardTitle>
            {location && (
              <Badge className="bg-green-500 text-white animate-pulse">
                <Navigation className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delivery Partner Info */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Delivery Partner</p>
              <p className="font-semibold text-lg">{deliveryPartner.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Contact</p>
                <a href={`tel:${deliveryPartner.phone}`} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  <Phone className="w-3 h-3" />
                  {deliveryPartner.phone}
                </a>
              </div>

              {deliveryPartner.rating && deliveryPartner.rating.totalRatings > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {deliveryPartner.rating.average.toFixed(1)} ({deliveryPartner.rating.totalRatings})
                  </div>
                </div>
              )}
            </div>

            {deliveryPartner.vehicleType && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vehicle</p>
                <p className="text-sm font-medium capitalize">
                  {deliveryPartner.vehicleType}
                  {deliveryPartner.vehicleNumber && ` - ${deliveryPartner.vehicleNumber}`}
                </p>
              </div>
            )}
          </div>

          {/* Location Info */}
          {location ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Location</p>
                  <p className="text-sm font-medium">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
                <Button size="sm" onClick={openInGoogleMaps} className="gap-2">
                  <MapPin className="w-4 h-4" />
                  View on Map
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last updated: {new Date(location.lastUpdated).toLocaleTimeString()}
              </div>

              {/* Map Preview */}
              <div className="relative h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                <iframe
                  title="Delivery Location Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${location.latitude},${location.longitude}&zoom=15`}
                  allowFullScreen
                ></iframe>
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Location will be available once delivery starts
              </p>
            </div>
          )}

          {/* Order Status */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-1">Current Status</p>
            <Badge className="capitalize">{orderStatus.replace('_', ' ')}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracking;
