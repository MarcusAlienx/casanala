'use client';

import React from 'react';
import MenuItem, { MenuItemProps } from './MenuItem';

interface MenuListProps {
  items: MenuItemProps[];
  // Removed Edit/Delete props
  onAddToCart: (item: MenuItemProps) => void; // Added AddToCart handler prop
}

const MenuList: React.FC<MenuListProps> = ({ items, onAddToCart }) => {
  if (!items || items.length === 0) {
    return <p>No hay platillos disponibles por el momento.</p>;
  }

  // Group items by category
  const groupedItems: { [category: string]: MenuItemProps[] } = items.reduce((acc, item) => {
    const category = item.category || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as { [category: string]: MenuItemProps[] });

  return (
    <div>
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 border-b pb-2 capitalize">{category.toLowerCase().replace(/_/g, ' ')}</h3> {/* Improved category display */}
          <div className="flex flex-wrap justify-center gap-4"> {/* Added gap */}
            {categoryItems.map((item) => (
              <MenuItem
                key={item.id}
                {...item}
                onAddToCart={onAddToCart}    // Pass down AddToCart handler
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuList;
