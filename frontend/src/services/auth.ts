const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'customer' | 'delivery_partner';
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  userType: 'customer' | 'delivery_partner';
  address?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    // Don't remove cart and orders - keep them user-specific
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get user-specific cart
  getUserCart(): { [key: string]: number } {
    const user = this.getUser();
    if (!user) return {};
    
    const cartKey = `cart_${user.id}`;
    const cartStr = localStorage.getItem(cartKey);
    return cartStr ? JSON.parse(cartStr) : {};
  }

  // Set user-specific cart
  setUserCart(cart: { [key: string]: number }): void {
    const user = this.getUser();
    if (!user) return;
    
    const cartKey = `cart_${user.id}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }

  // Clear user-specific cart
  clearUserCart(): void {
    const user = this.getUser();
    if (!user) return;
    
    const cartKey = `cart_${user.id}`;
    localStorage.removeItem(cartKey);
  }

  // ========== API-based Order Methods (MongoDB) ==========
  
  // Fetch orders from backend API
  async fetchOrders(): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Create order via API
  async createOrder(orderData: {
    items: any[];
    totalAmount: number;
    deliveryAddress: any;
    paymentMethod: string;
    customerNotes?: string;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }

    const data = await response.json();
    return data.order;
  }

  // Assign order to delivery partner
  async assignOrder(orderId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign order');
    }

    const data = await response.json();
    return data.order;
  }

  // Update order status
  async updateOrderStatusAPI(orderId: string, status: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update order status');
    }

    const data = await response.json();
    return data.order;
  }

  // Update delivery location
  async updateDeliveryLocation(orderId: string, latitude: number, longitude: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/location`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      throw new Error('Failed to update location');
    }
  }

  // Get delivery partner location for an order
  async getDeliveryLocation(orderId: string): Promise<any> {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/delivery-location`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch delivery location');
    }

    return await response.json();
  }

  // Upload prescription with ML verification
  async uploadPrescription(orderId: string, prescriptionFile: File): Promise<{
    verified: boolean;
    confidence: number;
    doctorName?: string;
    details: string;
    prescriptionId: string;
  }> {
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('prescription', prescriptionFile);

    const token = this.getToken();
    const response = await fetch(`${API_URL}/api/prescriptions/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload prescription');
    }

    const data = await response.json();
    return {
      verified: data.prescription.verified,
      confidence: data.prescription.confidence,
      doctorName: data.prescription.doctorName,
      details: data.prescription.details,
      prescriptionId: data.prescription.prescriptionId,
    };
  }

  // ========== Legacy localStorage Methods (Keep for backward compatibility) ==========
  
  // Get user-specific orders
  getUserOrders(): any[] {
    const user = this.getUser();
    if (!user) return [];
    
    const ordersKey = `orders_${user.id}`;
    const ordersStr = localStorage.getItem(ordersKey);
    return ordersStr ? JSON.parse(ordersStr) : [];
  }

  // Add order for user
  addUserOrder(order: any): void {
    const user = this.getUser();
    if (!user) return;
    
    const ordersKey = `orders_${user.id}`;
    const orders = this.getUserOrders();
    const newOrder = { 
      ...order, 
      id: Date.now().toString(), 
      userId: user.id,
      assignedTo: null, // Track which delivery partner has this order
      assignedAt: null
    };
    orders.push(newOrder);
    localStorage.setItem(ordersKey, JSON.stringify(orders));
  }

  // Get all orders for delivery partner view
  getAllCustomerOrders(): any[] {
    const allOrders: any[] = [];
    
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Only get customer orders, not delivery partner orders
      if (key && key.startsWith('orders_')) {
        const orders = localStorage.getItem(key);
        if (orders) {
          const parsedOrders = JSON.parse(orders);
          allOrders.push(...parsedOrders);
        }
      }
    }
    
    return allOrders;
  }

  // Assign order to delivery partner
  assignOrderToDeliveryPartner(orderId: string, deliveryPartnerId: string): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('orders_')) {
        const orders = localStorage.getItem(key);
        if (orders) {
          const parsedOrders: any[] = JSON.parse(orders);
          const orderIndex = parsedOrders.findIndex(o => o.id === orderId);
          
          if (orderIndex !== -1) {
            // Check if already assigned to someone else
            if (parsedOrders[orderIndex].assignedTo && 
                parsedOrders[orderIndex].assignedTo !== deliveryPartnerId) {
              return false; // Already assigned to another delivery partner
            }
            
            parsedOrders[orderIndex].assignedTo = deliveryPartnerId;
            parsedOrders[orderIndex].assignedAt = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(parsedOrders));
            return true;
          }
        }
      }
    }
    return false;
  }

  // Update order status
  updateOrderStatus(orderId: string, newStatus: string, deliveryPartnerId: string): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('orders_')) {
        const orders = localStorage.getItem(key);
        if (orders) {
          const parsedOrders: any[] = JSON.parse(orders);
          const orderIndex = parsedOrders.findIndex(o => o.id === orderId);
          
          if (orderIndex !== -1) {
            // Only allow update if assigned to this delivery partner or not assigned yet
            if (parsedOrders[orderIndex].assignedTo && 
                parsedOrders[orderIndex].assignedTo !== deliveryPartnerId) {
              return false;
            }
            
            parsedOrders[orderIndex].status = newStatus;
            localStorage.setItem(key, JSON.stringify(parsedOrders));
            return true;
          }
        }
      }
    }
    return false;
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const result: AuthResponse = await response.json();
    this.setToken(result.token);
    this.setUser(result.user);
    return result;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result: AuthResponse = await response.json();
    this.setToken(result.token);
    this.setUser(result.user);
    return result;
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const { user } = await response.json();
    this.setUser(user);
    return user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Profile update failed');
    }

    const { user } = await response.json();
    this.setUser(user);
    return user;
  }

  logout(): void {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
