'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Define the structure of a menu item
export interface MenuItemProps {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string; // Optional image URL
}

// Extend props to include event handler for adding to cart
interface MenuItemComponentProps extends MenuItemProps {
  onAddToCart: (item: MenuItemProps) => void; // Changed from Edit/Delete
}

const MenuItem: React.FC<MenuItemComponentProps> = ({ id, name, description, price, category, imageUrl, onAddToCart }) => {
  const itemData = { id, name, description, price, category, imageUrl }; // Create item object to pass

  return (
    <Card className="w-[300px] m-2 flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-4">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-32 object-cover mb-2 rounded-t-lg" onError={(e) => (e.currentTarget.src = '/images/placeholder.jpg')} /> // Added placeholder fallback
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center mb-2 rounded-t-lg">
            <span className="text-muted-foreground text-sm">Sin imagen</span>
          </div>
        )}
        <CardTitle className="text-lg">{name}</CardTitle>
        {description && <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="font-semibold text-primary">${price.toFixed(2)} MXN</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {/* Add to Cart Button */}
        <Button variant="default" size="sm" className="w-full" onClick={() => onAddToCart(itemData)}>
          Agregar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MenuItem;
