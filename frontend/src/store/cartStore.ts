import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Cart, CartItem } from "@/types";
import { getMockProductById } from "@/lib/mockData";

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: {
        items: [],
        subtotal: 0,
        item_count: 0
      },
      isLoading: false,

      fetchCart: async () => {
        // Hydrated from local storage automatically, just recalculate totals
        set({ isLoading: false });
      },

      addItem: async (productId, quantity) => {
        const { cart } = get();
        if (!cart) return;

        const product = getMockProductById(productId);
        if (!product) throw new Error("Product not found");

        const existingItemIndex = cart.items.findIndex(i => i.product_id === productId);

        let newItems = [...cart.items];

        if (existingItemIndex >= 0) {
          // Update quantity
          newItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          const newItem: CartItem = {
            id: Date.now() + Math.floor(Math.random() * 1000), // mock id
            product_id: productId,
            quantity,
            product
          };
          newItems.push(newItem);
        }

        const subtotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
        const item_count = newItems.reduce((acc, item) => acc + item.quantity, 0);

        set({
          cart: {
            items: newItems,
            subtotal,
            item_count
          }
        });
      },

      removeItem: async (itemId) => {
        const { cart } = get();
        if (!cart) return;

        const newItems = cart.items.filter(i => i.id !== itemId);
        const subtotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
        const item_count = newItems.reduce((acc, item) => acc + item.quantity, 0);

        set({
          cart: {
            items: newItems,
            subtotal,
            item_count
          }
        });
      },

      clearCart: async () => {
        set({
          cart: { items: [], subtotal: 0, item_count: 0 }
        });
      },
    }),
    {
      name: "oak-heritage-cart-storage", // local storage key
    }
  )
);
