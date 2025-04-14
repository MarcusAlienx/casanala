/**
 * Represents the location of a restaurant or customer.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  latitude: number;
  /**
   * The longitude of the location.
   */
  longitude: number;
}

/**
 * Represents a food item available for delivery.
 */
export interface FoodItem {
  /**
   * The name of the food item.
   */
  name: string;
  /**
   * A description of the food item.
   */
  description: string;
  /**
   * The price of the food item.
   */
  price: number;
}

/**
 * Represents a menu of food items.
 */
export interface Menu {
  /**
   * A list of food items in the menu.
   */
  items: FoodItem[];
}

/**
 * Represents a delivery order.
 */
export interface Order {
  /**
   * The unique identifier of the order.
   */
  orderId: string;
  /**
   * The location where the order should be delivered.
   */
  deliveryLocation: Location;
  /**
   * The items included in the order.
   */
  items: FoodItem[];
  /**
   * The status of the order.
   */
  status: 'pending' | 'accepted' | 'preparing' | 'en_route' | 'delivered' | 'cancelled';
}

/**
 * Asynchronously retrieves the menu for a restaurant.
 *
 * @param restaurantId The ID of the restaurant.
 * @returns A promise that resolves to a Menu object.
 */
export async function getMenu(restaurantId: string): Promise<Menu> {
  // TODO: Implement this by calling the Uber Eats API.
  return {
    items: [
      {
        name: 'Taco al Pastor',
        description: 'Marinated pork taco with pineapple',
        price: 2.50,
      },
      {
        name: 'Quesadilla',
        description: 'Corn tortilla filled with cheese',
        price: 3.00,
      },
    ],
  };
}

/**
 * Asynchronously places an order for delivery.
 *
 * @param restaurantId The ID of the restaurant.
 * @param order The order to place.
 * @returns A promise that resolves to an Order object.
 */
export async function placeOrder(restaurantId: string, order: Order): Promise<Order> {
  // TODO: Implement this by calling the Uber Eats API.
  return {
    orderId: '12345',
    deliveryLocation: order.deliveryLocation,
    items: order.items,
    status: 'pending',
  };
}

/**
 * Asynchronously retrieves the status of an order.
 *
 * @param orderId The ID of the order.
 * @returns A promise that resolves to an Order object.
 */
export async function getOrderStatus(orderId: string): Promise<Order> {
  // TODO: Implement this by calling the Uber Eats API.
  return {
    orderId: '12345',
    deliveryLocation: {
      latitude: 0,
      longitude: 0,
    },
    items: [
      {
        name: 'Taco al Pastor',
        description: 'Marinated pork taco with pineapple',
        price: 2.50,
      },
    ],
    status: 'en_route',
  };
}
