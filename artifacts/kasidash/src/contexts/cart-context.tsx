import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { cartApi, type Cart } from "@/lib/store-api";
import { useAuth } from "./auth-context";

interface CartContextType {
  cart: Cart;
  loading: boolean;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const emptyCart: Cart = { items: [], total: 0, itemCount: 0 };

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) { setCart(emptyCart); return; }
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch {
      setCart(emptyCart);
    }
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const addItem = async (productId: number, quantity = 1) => {
    setLoading(true);
    try {
      const data = await cartApi.addItem(productId, quantity);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    setLoading(true);
    try {
      const data = await cartApi.updateItem(itemId, quantity);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setLoading(true);
    try {
      const data = await cartApi.removeItem(itemId);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const data = await cartApi.clear();
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
