'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type PurchasePlan = 'one-time' | 'autoship';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  plan: PurchasePlan;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, size: string, plan: PurchasePlan) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = window.localStorage.getItem('viking-cart');
    if (!saved) return [];
    try {
      const parsed: CartItem[] = JSON.parse(saved);
      return parsed.map((item) => ({
        ...item,
        plan: item.plan ?? 'one-time',
      }));
    } catch (e) {
      console.error('Failed to load cart', e);
      return [];
    }
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('viking-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems((current) => {
      const existing = current.find(
        (i) => i.id === newItem.id && i.size === newItem.size && i.plan === newItem.plan
      );
      if (existing) {
        return current.map((i) =>
          i.id === newItem.id && i.size === newItem.size && i.plan === newItem.plan
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...current, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: string, size: string, plan: PurchasePlan) => {
    setItems((current) => current.filter((i) => !(i.id === id && i.size === size && i.plan === plan)));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
