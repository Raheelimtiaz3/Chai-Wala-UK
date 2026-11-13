'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartItem } from '@/lib/types';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotalPence: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toastMessage: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number, openDrawer?: boolean) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  clearCart: () => void;
  hydrated: boolean;
}

const STORAGE_KEY = 'chaiwala_cart_v1';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch {
        // Ignore corrupt storage
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota issues
    }
  }, [items, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1, openDrawer = true) => {
      const safeQty = Math.max(1, Math.min(quantity, item.maxStock || 50));
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.variantId === item.variantId);
        if (idx >= 0) {
          const updated = [...prev];
          const nextQty = Math.min(
            updated[idx].quantity + safeQty,
            item.maxStock || 50
          );
          updated[idx] = { ...updated[idx], ...item, quantity: nextQty };
          return updated;
        }
        return [...prev, { ...item, quantity: safeQty }];
      });
      showToast(`Added ${item.name} (${item.variantLabel}) to basket`);
      if (openDrawer) {
        setDrawerOpen(true);
      }
    },
    [showToast]
  );

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.variantId !== variantId);
      }
      return prev.map((i) =>
        i.variantId === variantId
          ? { ...i, quantity: Math.min(quantity, i.maxStock || 50) }
          : i
      );
    });
  }, []);

  const removeItem = useCallback((variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalPence = items.reduce((sum, i) => sum + i.pricePence * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalPence,
        drawerOpen,
        setDrawerOpen,
        toastMessage,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
