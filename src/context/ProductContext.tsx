import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { subscribeToCollection, createDocument } from '../services/firestore';
import { Product } from '../types'; // Import Product from types.ts
import { products as initialProducts } from '../data/products';
import { useAuth } from './AuthContext';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: Product) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Product>(
      'products', 
      (data) => {
        if (data.length === 0) {
          // If database is empty, just show empty products. Admin can manually seed from Admin Dashboard.
          setProducts([]);
          setLoading(false);
        } else {
          setProducts(data);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Product subscription failed, falling back to local data:", error);
        setProducts(initialProducts);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const addProduct = async (product: Product) => {
    await createDocument('products', product, product.id);
  };

  const value = useMemo(() => ({ 
    products, 
    loading, 
    addProduct 
  }), [products, loading]);

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
