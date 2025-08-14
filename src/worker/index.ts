import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  CreateCustomerSchema,
  type MenuItemWithOptions,
  type OrderWithDetails,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Customer routes
app.post("/api/customers", zValidator("json", CreateCustomerSchema), async (c) => {
  const { name, phone } = c.req.valid("json");
  
  const result = await c.env.DB.prepare(
    "INSERT INTO customers (name, phone) VALUES (?, ?) RETURNING *"
  ).bind(name, phone).first();

  return c.json(result);
});

app.get("/api/customers/:id", async (c) => {
  const id = c.req.param("id");
  
  const customer = await c.env.DB.prepare(
    "SELECT * FROM customers WHERE id = ?"
  ).bind(id).first();

  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  return c.json(customer);
});

// Menu routes
app.get("/api/menu", async (c) => {
  const menuItems = await c.env.DB.prepare(
    "SELECT * FROM menu_items ORDER BY item_type, name"
  ).all();

  const options = await c.env.DB.prepare(
    "SELECT * FROM menu_item_options ORDER BY menu_item_id, option_name"
  ).all();

  const menuWithOptions: MenuItemWithOptions[] = menuItems.results.map((item: any) => ({
    ...item,
    options: options.results.filter((option: any) => option.menu_item_id === item.id)
  }));

  return c.json(menuWithOptions);
});

// Order routes
app.post("/api/orders", async (c) => {
  try {
    const body = await c.req.json();
    const { customer_id, items } = body;

    if (!customer_id || !items) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const customerId = customer_id;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const menuItem: any = await c.env.DB.prepare(
        "SELECT * FROM menu_items WHERE id = ?"
      ).bind(item.menu_item_id).first();

      if (!menuItem) {
        return c.json({ error: `Menu item ${item.menu_item_id} not found` }, 400);
      }

      let itemPrice: number = menuItem.base_price;
      
      if (item.selected_options && item.selected_options.length > 0) {
        const optionPrices: any = await c.env.DB.prepare(
          `SELECT SUM(price_modifier) as total_modifier FROM menu_item_options WHERE id IN (${item.selected_options.map(() => '?').join(',')})`
        ).bind(...item.selected_options).first();
        
        itemPrice += optionPrices?.total_modifier || 0;
      }

      totalAmount += itemPrice * item.quantity;
    }

    // Create order
    const order: any = await c.env.DB.prepare(
      "INSERT INTO orders (customer_id, total_amount) VALUES (?, ?) RETURNING *"
    ).bind(customerId, totalAmount).first();

    if (!order) {
      return c.json({ error: "Failed to create order" }, 500);
    }

    // Create order items
    for (const item of items) {
      const menuItem: any = await c.env.DB.prepare(
        "SELECT * FROM menu_items WHERE id = ?"
      ).bind(item.menu_item_id).first();

      if (!menuItem) {
        continue;
      }

      let itemPrice: number = menuItem.base_price;
      
      if (item.selected_options && item.selected_options.length > 0) {
        const optionPrices: any = await c.env.DB.prepare(
          `SELECT SUM(price_modifier) as total_modifier FROM menu_item_options WHERE id IN (${item.selected_options.map(() => '?').join(',')})`
        ).bind(...item.selected_options).first();
        
        itemPrice += optionPrices?.total_modifier || 0;
      }

      const itemTotal = itemPrice * item.quantity;

      await c.env.DB.prepare(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, selected_options, item_total) VALUES (?, ?, ?, ?, ?)"
      ).bind(
        order.id,
        item.menu_item_id,
        item.quantity,
        JSON.stringify(item.selected_options || []),
        itemTotal
      ).run();
    }

    return c.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return c.json({ error: "Failed to create order" }, 500);
  }
});

app.get("/api/orders/customer/:customerId", async (c) => {
  
  const orders = await c.env.DB.prepare(
    "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC"
  ).all();

  return c.json(orders.results);
});

// Define allowed admin emails
const ALLOWED_ADMIN_EMAILS = [
  "phonemyintzaw3033@gmail.com",
  "st124359@ait.asia"
];

// Helper function to check admin authorization
const checkAdminAuth = (c: any) => {
  const user = c.get("user");
  if (!ALLOWED_ADMIN_EMAILS.includes(user.email)) {
    return c.json({ error: "Unauthorized access. You are not an admin." }, 403);
  }
  return null;
};

// Menu management routes (admin only)
app.post("/api/admin/menu", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const body = await c.req.json();
    const { name, base_price, item_type } = body;

    if (!name || !base_price || !item_type) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const menuItem = await c.env.DB.prepare(
      "INSERT INTO menu_items (name, base_price, item_type) VALUES (?, ?, ?) RETURNING *"
    ).bind(name, base_price, item_type).first();

    return c.json(menuItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return c.json({ error: "Failed to create menu item" }, 500);
  }
});

app.put("/api/admin/menu/:id", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, base_price, item_type } = body;

    if (!name || !base_price || !item_type) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const menuItem = await c.env.DB.prepare(
      "UPDATE menu_items SET name = ?, base_price = ?, item_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(name, base_price, item_type, id).first();

    if (!menuItem) {
      return c.json({ error: "Menu item not found" }, 404);
    }

    return c.json(menuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return c.json({ error: "Failed to update menu item" }, 500);
  }
});

app.delete("/api/admin/menu/:id", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const id = c.req.param("id");

    // Delete associated options first
    await c.env.DB.prepare(
      "DELETE FROM menu_item_options WHERE menu_item_id = ?"
    ).bind(id).run();

    // Delete the menu item
    const result = await c.env.DB.prepare(
      "DELETE FROM menu_items WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Menu item not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return c.json({ error: "Failed to delete menu item" }, 500);
  }
});

app.post("/api/admin/menu/:id/options", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const menuItemId = c.req.param("id");
    const body = await c.req.json();
    const { option_name, price_modifier } = body;

    if (!option_name) {
      return c.json({ error: "Option name is required" }, 400);
    }

    const option = await c.env.DB.prepare(
      "INSERT INTO menu_item_options (menu_item_id, option_name, price_modifier) VALUES (?, ?, ?) RETURNING *"
    ).bind(menuItemId, option_name, price_modifier || 0).first();

    return c.json(option);
  } catch (error) {
    console.error("Error creating menu option:", error);
    return c.json({ error: "Failed to create menu option" }, 500);
  }
});

app.put("/api/admin/menu/options/:id", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const id = c.req.param("id");
    const body = await c.req.json();
    const { option_name, price_modifier } = body;

    if (!option_name) {
      return c.json({ error: "Option name is required" }, 400);
    }

    const option = await c.env.DB.prepare(
      "UPDATE menu_item_options SET option_name = ?, price_modifier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
    ).bind(option_name, price_modifier || 0, id).first();

    if (!option) {
      return c.json({ error: "Option not found" }, 404);
    }

    return c.json(option);
  } catch (error) {
    console.error("Error updating menu option:", error);
    return c.json({ error: "Failed to update menu option" }, 500);
  }
});

app.delete("/api/admin/menu/options/:id", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      "DELETE FROM menu_item_options WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Option not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu option:", error);
    return c.json({ error: "Failed to delete menu option" }, 500);
  }
});

// Admin routes (protected)
app.get("/api/admin/orders", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const url = new URL(c.req.url);
    const customerName = url.searchParams.get("customer_name");
    const date = url.searchParams.get("date");

    let query = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
    `;
    
    const bindings: any[] = [];
    const conditions: string[] = [];

    if (customerName) {
      conditions.push("c.name LIKE ?");
      bindings.push(`%${customerName}%`);
    }

    if (date) {
      conditions.push("DATE(o.created_at) = ?");
      bindings.push(date);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY o.created_at DESC";

    const orders = await c.env.DB.prepare(query).bind(...bindings).all();

    // Get order items for each order
    const ordersWithDetails: OrderWithDetails[] = [];
    
    for (const order of orders.results as any[]) {
      const items = await c.env.DB.prepare(`
        SELECT 
          oi.*,
          mi.name as menu_item_name,
          mi.base_price as menu_item_base_price,
          mi.item_type as menu_item_type
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `).bind(order.id).all();

      ordersWithDetails.push({
        id: order.id,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        receipt_url: order.receipt_url,
        status: order.status,
        is_ready: order.is_ready,
        is_completed: order.is_completed,
        created_at: order.created_at,
        updated_at: order.updated_at,
        customer: {
          id: order.customer_id,
          name: order.customer_name,
          phone: order.customer_phone,
          created_at: "",
          updated_at: ""
        },
        items: (items.results as any[]).map(item => ({
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          selected_options: item.selected_options,
          item_total: item.item_total,
          created_at: item.created_at,
          updated_at: item.updated_at,
          menu_item: {
            id: item.menu_item_id,
            name: item.menu_item_name,
            base_price: item.menu_item_base_price,
            item_type: item.menu_item_type || "snack",
            created_at: "",
            updated_at: ""
          }
        }))
      });
    }

    return c.json(ordersWithDetails);
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

app.post("/api/admin/orders/mark-all-ready", authMiddleware, async (c) => {
  // Check admin authorization
  const authCheck = checkAdminAuth(c);
  if (authCheck) return authCheck;

  await c.env.DB.prepare(
    "UPDATE orders SET is_ready = TRUE, status = 'ready' WHERE status = 'pending'"
  ).run();

  return c.json({ success: true });
});

app.post("/api/admin/orders/:id/complete", authMiddleware, async (c) => {
  // Check admin authorization
  const authCheck = checkAdminAuth(c);
  if (authCheck) return authCheck;

  const orderId = c.req.param("id");
  
  await c.env.DB.prepare(
    "UPDATE orders SET is_completed = TRUE, status = 'completed' WHERE id = ?"
  ).bind(orderId).run();

  return c.json({ success: true });
});

app.get("/api/admin/daily-totals", authMiddleware, async (c) => {
  // Check admin authorization
  const authCheck = checkAdminAuth(c);
  if (authCheck) return authCheck;

  const url = new URL(c.req.url);
  const date = url.searchParams.get("date") || new Date().toISOString().split('T')[0];

  // Calculate from 12 PM to 12 PM (next day)
  const startTime = `${date} 12:00:00`;
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const endTime = `${nextDay.toISOString().split('T')[0]} 12:00:00`;

  const totals = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_amount,
      SUM((
        SELECT SUM(quantity) 
        FROM order_items 
        WHERE order_id = orders.id
      )) as total_quantity
    FROM orders 
    WHERE created_at >= ? AND created_at < ?
  `).bind(startTime, endTime).first();

  return c.json(totals);
});

app.get("/api/admin/menu-analytics", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const url = new URL(c.req.url);
    const date = url.searchParams.get("date");

    let query = `
      SELECT 
        mi.id,
        mi.name,
        mi.item_type,
        SUM(oi.quantity) as total_quantity,
        COUNT(oi.id) as order_count
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
      LEFT JOIN orders o ON oi.order_id = o.id
    `;
    
    const bindings: any[] = [];

    if (date) {
      query += " WHERE DATE(o.created_at) = ?";
      bindings.push(date);
    }

    query += `
      GROUP BY mi.id, mi.name, mi.item_type
      ORDER BY total_quantity DESC, mi.name
    `;

    const analytics = await c.env.DB.prepare(query).bind(...bindings).all();

    return c.json(analytics.results);
  } catch (error) {
    console.error("Error fetching menu analytics:", error);
    return c.json({ error: "Failed to fetch menu analytics" }, 500);
  }
});

app.delete("/api/admin/orders/:id", authMiddleware, async (c) => {
  try {
    // Check admin authorization
    const authCheck = checkAdminAuth(c);
    if (authCheck) return authCheck;

    const orderId = c.req.param("id");

    // Delete order items first
    await c.env.DB.prepare(
      "DELETE FROM order_items WHERE order_id = ?"
    ).bind(orderId).run();

    // Delete the order
    const result = await c.env.DB.prepare(
      "DELETE FROM orders WHERE id = ?"
    ).bind(orderId).run();

    if (!result.success) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return c.json({ error: "Failed to delete order" }, 500);
  }
});

export default app;
