import z from "zod";

// Customer schemas
export const CustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
});

// Menu item schemas
export const MenuItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  base_price: z.number(),
  item_type: z.enum(["fried_rice", "curry", "snack", "tea"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MenuItemOptionSchema = z.object({
  id: z.number(),
  menu_item_id: z.number(),
  option_name: z.string(),
  price_modifier: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Order schemas
export const OrderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  menu_item_id: z.number(),
  quantity: z.number(),
  selected_options: z.string(), // JSON string
  item_total: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const OrderSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  total_amount: z.number(),
  receipt_url: z.string().nullable(),
  status: z.enum(["pending", "ready", "completed"]),
  is_ready: z.boolean(),
  is_completed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateOrderSchema = z.object({
  customer_id: z.number(),
  items: z.array(z.object({
    menu_item_id: z.number(),
    quantity: z.number().min(1),
    selected_options: z.array(z.number()).optional(),
  })),
  receipt_file: z.any().optional(), // File upload
});

// Cart item for frontend
export const CartItemSchema = z.object({
  menu_item_id: z.number(),
  name: z.string(),
  quantity: z.number(),
  selected_options: z.array(z.number()).optional(),
  item_total: z.number(),
});

// Admin schemas
export const OrderSearchSchema = z.object({
  customer_name: z.string().optional(),
  date: z.string().optional(),
});

// Type exports
export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuItemOption = z.infer<typeof MenuItemOptionSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type OrderSearch = z.infer<typeof OrderSearchSchema>;

// Extended types for frontend
export type MenuItemWithOptions = MenuItem & {
  options: MenuItemOption[];
};

export type OrderWithDetails = Order & {
  customer: Customer;
  items: (OrderItem & {
    menu_item: MenuItem;
  })[];
};
