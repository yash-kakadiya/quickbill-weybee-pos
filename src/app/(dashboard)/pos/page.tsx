'use client';

import { useState, useEffect, useRef } from 'react';
import { getProducts } from '@/actions/product.actions';
import { createOrder } from '@/actions/order.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  product: any;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync ref with state (though we also update ref synchronously below)
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  async function fetchProducts() {
    const result = await getProducts(search);
    if (result.success && result.data) {
      // For POS, we only want active products with stock > 0
      setProducts(result.data.filter(p => p.isActive && p.stock > 0));
    }
  }

  function addToCart(product: any) {
    const existing = cartRef.current.find(item => item.product.id === product.id);
    if (existing && existing.quantity >= product.stock) {
      toast.error(`Cannot add more. Only ${product.stock} in stock.`);
      return;
    }
    
    let newCart;
    if (existing) {
      newCart = cartRef.current.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cartRef.current, { product, quantity: 1 }];
    }
    
    cartRef.current = newCart;
    setCart(newCart);
  }

  function updateQuantity(productId: string, delta: number) {
    const existing = cartRef.current.find(item => item.product.id === productId);
    if (!existing) return;
    
    const newQuantity = existing.quantity + delta;
    if (newQuantity <= 0) return;
    
    if (newQuantity > existing.product.stock) {
      toast.error(`Only ${existing.product.stock} available.`);
      return;
    }

    const newCart = cartRef.current.map(item => 
      item.product.id === productId ? { ...item, quantity: newQuantity } : item
    );
    
    cartRef.current = newCart;
    setCart(newCart);
  }

  function removeFromCart(productId: string) {
    const newCart = cartRef.current.filter(item => item.product.id !== productId);
    cartRef.current = newCart;
    setCart(newCart);
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  async function handleCheckout() {
    if (cart.length === 0) return toast.error('Cart is empty');
    
    setIsProcessing(true);
    const orderData = {
      customerName: customerName.trim() || undefined,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    const result = await createOrder(orderData);
    if (result.success) {
      toast.success(`Order ${result.invoiceNumber} placed successfully!`);
      cartRef.current = [];
      setCart([]);
      setCustomerName('');
      fetchProducts(); // Refresh stock immediately
    } else {
      toast.error(result.error);
      // If error was insufficient stock, we should refresh products to show new stock limits
      fetchProducts();
    }
    setIsProcessing(false);
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      
      {/* Product Selection Area */}
      <div className="md:col-span-2 flex flex-col gap-4">
        <div className="flex items-center relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products by name or SKU..." 
            className="pl-9 h-12 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <ScrollArea className="flex-1 border rounded-md p-4 bg-card">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-colors flex flex-col"
                onClick={() => addToCart(product)}
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base line-clamp-1" title={product.name}>{product.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-lg">₹{product.price.toFixed(2)}</span>
                    <span className={`text-xs ${product.stock <= product.lowStockThreshold ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                      {product.stock} left
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No active products in stock matching your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Area */}
      <div className="flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/50 py-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Current Bill
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {cart.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-2 py-12">
                  <ShoppingCart className="h-12 w-12 opacity-20" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex flex-col gap-2 border-b pb-4">
                      <div className="flex justify-between font-medium">
                        <span className="line-clamp-1">{item.product.name}</span>
                        <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">₹{item.product.price.toFixed(2)} each</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)} disabled={item.quantity <= 1}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-4 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)} disabled={item.quantity >= item.product.stock}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive ml-1" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          <CardFooter className="flex-col gap-4 bg-muted/50 pt-6">
            <div className="w-full space-y-2">
              <Input 
                placeholder="Customer Name (Optional)" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>
            <div className="w-full flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full h-12 text-lg" 
              size="lg" 
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? 'Processing...' : 'Confirm Order'}
            </Button>
          </CardFooter>
        </Card>
      </div>

    </div>
  );
}
