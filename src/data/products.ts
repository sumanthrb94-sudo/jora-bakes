import { Product } from '../types';

export const products: Product[] = [
  {
    id: 'p1',
    category: 'millet_brownies',
    name: 'Millet Brownie',
    description: 'Guilt-free, fudgy brownies made with your choice of wholesome, nutrient-rich millets.',
    price: 150,
    weight: '1 Piece',
    variants: [
      { id: 'v1_pc', flavor: 'Standard', priceModifier: 0, weight: '1 Piece' },
      { id: 'v1_half', flavor: 'Standard', priceModifier: 550, weight: 'Half Kg' }
    ],
    customizationGroups: [
      {
        id: 'cg_millet',
        name: 'Choose Millet Base',
        required: true,
        selectionType: 'single',
        options: [
          { id: 'opt_jowar', name: 'Jowar', priceModifier: 0, isBestSeller: true },
          { id: 'opt_ragi', name: 'Ragi', priceModifier: 0 },
          { id: 'opt_wheat', name: 'Whole Wheat', priceModifier: 0 },
          { id: 'opt_oats', name: 'Oats', priceModifier: 0 }
        ]
      },
      {
        id: 'cg_topping_mb',
        name: 'Toppings & Add-ons',
        required: false,
        selectionType: 'multiple',
        options: [
          { id: 'add_almond_mb', name: 'Almonds', priceModifier: 0 },
          { id: 'add_cashew_mb', name: 'Cashew', priceModifier: 0 },
          { id: 'add_walnut_mb', name: 'Walnuts', priceModifier: 0 },
          { id: 'add_exchoc_mb', name: 'Extra Chocolate', priceModifier: 30 }
        ]
      }
    ],
    isEggless: true,
    isAvailable: true, 
    bakeTime: 'Order 1 day prior for freshly baked delicacies',
    allergens: ['dairy', 'gluten'],
    images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800'],
    ingredients: ['Millet Flour', 'Dark Chocolate', 'Butter', 'Jaggery'],
    shelfLife: '4 days',
    storage: 'Store in an airtight container at room temperature.',
    pairings: ['Cold Milk', 'Hot Coffee'],
    isBestSeller: true,
    isNew: false,
  },
  {
    id: 'p2',
    category: 'cheese_cakes',
    name: 'Classic Cheesecake',
    description: 'Rich, creamy, and perfectly smooth baked cheesecake with a buttery cracker crust.',
    price: 200,
    weight: '1 Slice',
    variants: [
      { id: 'v2_slice', flavor: 'Standard', priceModifier: 0, weight: '1 Slice' },
      { id: 'v2_half', flavor: 'Standard', priceModifier: 1000, weight: 'Half Kg' }
    ],
    customizationGroups: [
      {
        id: 'cg_flavor',
        name: 'Choose Flavour',
        required: true,
        selectionType: 'single',
        options: [
          { id: 'f_choc', name: 'Chocolate', priceModifier: 0, isBestSeller: true },
          { id: 'f_straw', name: 'Strawberry (depends on seasonal availability)', priceModifier: 0 },
          { id: 'f_nut', name: 'Nutella', priceModifier: 0, isBestSeller: true },
          { id: 'f_blue', name: 'Blueberry', priceModifier: 0 }
        ]
      },
      {
        id: 'cg_addon_cc',
        name: 'Extra Add-ons',
        required: false,
        selectionType: 'multiple',
        options: [
          { id: 'add_choc_cc', name: 'Add on Chocolate', priceModifier: 30 }
        ]
      }
    ],
    isEggless: true,
    isAvailable: true, 
    bakeTime: 'Order 1 day prior for freshly baked delicacies',
    allergens: ['dairy', 'gluten'],
    images: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=800'],
    ingredients: ['Cream Cheese', 'Fresh Cream', 'Sugar', 'Cracker Crumb'],
    shelfLife: '3-4 days',
    storage: 'Refrigerate in an airtight container.',
    pairings: ['Berry Compote'],
    isBestSeller: true,
    isNew: false,
  },
  {
    id: 'p3',
    category: 'burnt_basque',
    name: 'Burnt Basque Cheesecake',
    description: 'Caramelized, rustic top with a beautifully soft, gooey, and melt-in-your-mouth center.',
    price: 200,
    weight: '1 Slice',
    variants: [
      { id: 'v3_slice', flavor: 'Standard', priceModifier: 0, weight: '1 Slice' },
      { id: 'v3_half', flavor: 'Standard', priceModifier: 1000, weight: 'Half Kg' }
    ],
    customizationGroups: [
      {
        id: 'cg_flavor',
        name: 'Choose Flavour',
        required: true,
        selectionType: 'single',
        options: [
          { id: 'f_choc', name: 'Chocolate', priceModifier: 0, isBestSeller: true },
          { id: 'f_straw', name: 'Strawberry (depends on seasonal availability)', priceModifier: 0 },
          { id: 'f_nut', name: 'Nutella', priceModifier: 0, isBestSeller: true },
          { id: 'f_blue', name: 'Blueberry', priceModifier: 0 }
        ]
      },
      {
        id: 'cg_addon_bb',
        name: 'Extra Add-ons',
        required: false,
        selectionType: 'multiple',
        options: [
          { id: 'add_choc_bb', name: 'Add on Chocolate', priceModifier: 30 }
        ]
      }
    ],
    isEggless: true, 
    isAvailable: true, 
    bakeTime: 'Order 1 day prior for freshly baked delicacies',
    allergens: ['dairy', 'gluten'],
    images: ['https://images.unsplash.com/photo-1650302525164-32b0c1ecac6e?auto=format&fit=crop&q=80&w=800'],
    ingredients: ['Cream Cheese', 'Heavy Cream', 'Sugar', 'Vanilla'],
    shelfLife: '3-4 days',
    storage: 'Refrigerate in an airtight container.',
    pairings: ['Espresso'],
    isBestSeller: true,
    isNew: true,
  },
  {
    id: 'p4',
    category: 'cupcakes',
    name: 'Assorted Cupcakes 🧁',
    description: 'Soft, fluffy, and perfectly sweet cupcakes topped with rich buttercream frosting. Perfect for any celebration.',
    price: 350,
    weight: 'Box of 4',
    variants: [
      { id: 'v4_b4', flavor: 'Standard', priceModifier: 0, weight: 'Box of 4' },
      { id: 'v4_b6', flavor: 'Standard', priceModifier: 200, weight: 'Box of 6' },
      { id: 'v4_b9', flavor: 'Standard', priceModifier: 500, weight: 'Box of 9' }
    ],
    customizationGroups: [
      {
        id: 'cg_flavor',
        name: 'Choose Primary Flavour',
        required: true,
        selectionType: 'single',
        options: [
          { id: 'f_bb', name: 'Banana blueberry- with cream cheese', priceModifier: 0 },
          { id: 'f_rv', name: 'Red velvet with cream cheese', priceModifier: 0, isBestSeller: true },
          { id: 'f_sc', name: 'Spiced carrot with cream cheese', priceModifier: 0 },
          { id: 'f_cg', name: 'Chocolate with ganache', priceModifier: 0 },
          { id: 'f_vb', name: 'Vanilla with butter cream', priceModifier: 0 }
        ]
      }
    ],
    isEggless: true,
    isAvailable: true, 
    bakeTime: 'Order 1 day prior for freshly baked delicacies',
    allergens: ['dairy', 'gluten'],
    images: ['https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=800'],
    ingredients: ['Flour', 'Butter', 'Sugar', 'Milk', 'Flavoring'],
    shelfLife: '2 weeks',
    storage: 'Store in a cool place at room temperature.',
    pairings: ['Celebration!'],
    isBestSeller: false,
    isNew: false,
  },
  {
    id: 'p5',
    category: 'tiramisu',
    name: 'Signature Tiramisu',
    description: 'Layers of espresso-soaked ladyfingers and velvety mascarpone cream, generously dusted with cocoa powder.',
    price: 350,
    weight: '1 Tub',
    variants: [
      { id: 'v5_tub', flavor: 'Classic Espresso', priceModifier: 0, weight: '1 Tub (250g)' },
      { id: 'v5_large', flavor: 'Classic Espresso', priceModifier: 500, weight: 'Large Tub (500g)' }
    ],
    isEggless: true,
    isAvailable: true, 
    bakeTime: 'Order 1 day prior for freshly baked delicacies',
    allergens: ['dairy', 'gluten'],
    images: ['https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=800'],
    ingredients: ['Mascarpone Cheese', 'Espresso', 'Cocoa Powder', 'Vanilla Sponge'],
    shelfLife: '2-3 days',
    storage: 'Refrigerate immediately.',
    pairings: ['After Dinner Dessert'],
    isBestSeller: false,
    isNew: true,
  },
];
