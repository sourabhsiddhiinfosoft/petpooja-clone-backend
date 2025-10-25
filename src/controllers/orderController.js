import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import InventoryItem from "../models/InventoryItem.js";
import Table from "../models/Table.js";
import kotModel from "../models/kotModel.js";

// const computeTotals = (items, taxRate, discount = 0) => {
//   const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
//   const tax = +(subtotal * taxRate).toFixed(2);
//   const total = +(subtotal + tax - discount).toFixed(2);
//   return { subtotal, tax, discount, total };
// };


// Robust computeTotals utility (add to utils/orderUtils.js or inline here)
const computeTotals = (itemDocs, taxRate = 0.05, discountRate = 0) => {
  if (!Array.isArray(itemDocs) || itemDocs.length === 0) {
    return { subtotal: 0, discount: 0, tax: 0, total: 0 };
  }

  // Ensure all items have numeric price and qty
  const validItems = itemDocs
    .filter(item => {
      const price = Number(item.price);
      const qty = Number(item.qty);
      if (isNaN(price) || isNaN(qty) || qty <= 0 || price <= 0) {
        console.warn('Invalid item in computeTotals:', item); // Debug
        return false;
      }
      return true;
    });

  if (validItems.length === 0) {
    return { subtotal: 0, discount: 0, tax: 0, total: 0 };
  }

  // Calculate subtotal
  const subtotal = validItems.reduce((sum, item) => {
    const itemTotal = Number(item.price) * Number(item.qty);
    return sum + itemTotal;
  }, 0);

  // Apply discount (as percentage or fixed; assuming percentage here)
  const discountAmount = subtotal * (discountRate / 100);
  const discountedSubtotal = subtotal - discountAmount;

  // Calculate tax on discounted subtotal
  const tax = discountedSubtotal * taxRate;

  // Total
  const total = discountedSubtotal + tax;

  // Ensure all are numbers (prevent NaN propagation)
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discountAmount.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};


const deductInventoryForOrder = async (order) => {
  for (const oi of order.items) {
    const menu = await MenuItem.findById(oi.menuItem).populate("ingredients.inventoryItem");
    if (!menu) continue;
    for (const ing of (menu.ingredients || [])) {
      const needed = (ing.qty || 0) * oi.qty;
      if (!ing.inventoryItem) continue;
      await InventoryItem.findByIdAndUpdate(ing.inventoryItem._id, { $inc: { quantity: -needed } });
    }
  }
};

// ✅ PLACE ORDER / KOT
export const placeOrder = async (req, res) => {
  try {
    const { type, tableNo, tableId, customer, items, discount = 0, taxRate = 0 } = req.body;
    const restaurantId = req.user.restaurantId || req.body.restaurantId;
    const branchId = req.user.branchId || req.body.branchId;

    console.log('Placing order with:', { restaurantId, branchId, type, tableNo, tableId, customer, items, discount, taxRate });

    if (!restaurantId || !branchId)
      return res.status(400).json({ error: "restaurantId and branchId required" });

    const itemDocs = await Promise.all(
      items.map(async (i) => {
        const m = await MenuItem.findById(i._id);
        if (!m) throw new Error("Menu item not found");
        return { menuItem: m._id, name: m.name, qty: i?.quantity || i?.qty, price: m.price };
      })
    );

    const totals = computeTotals(itemDocs, taxRate, discount);
    const orderPayload = {
      restaurantId,
      branchId,
      type,
      tableNo,
      tableId,
      customer,
      items: itemDocs,
      ...totals,
      createdBy: req.user._id, // ✅ staff or owner who created it
      status: "pending",
    };

    const order = await Order.create(orderPayload);

    // ✅ Auto create KOT
    const kot = await kotModel.create({
      orderId: order._id,
      restaurantId,
      branchId,
      tableId,
      tableNo,
      items: itemDocs.map((i) => ({ menuItem: i.menuItem, name: i.name, qty: i.qty })),
      createdBy: req.user._id,
    });

    // Link KOT to Order
    order.kotIds.push(kot._id);
    await order.save();

    // ✅ Mark table occupied
    // if (tableId && type === "dine-in") {
    //   await Table.findByIdAndUpdate(tableId, { status: "occupied" });
    // }

     // ✅ Mark table occupied AND track current order ID
    if (tableId && type === ("dine-in" || "occupied")) {
      const updateResult = await Table.findByIdAndUpdate(
        tableId, 
        { 
          status: "occupied",
          currentOrder: order._id // ✅ New: Track running order ID in table
        },
        { new: true } // Return updated document
      );
      
      if (!updateResult) {
        console.error('Failed to update table:', tableId); // Log but don't fail order
      } else {
        console.log('Table updated with order:', tableId, order._id); // Debug log
      }
    }

    // ✅ Deduct inventory
    await deductInventoryForOrder(order);

    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ✅ GET SINGLE ORDER
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.menuItem")
      .populate("tableId")
      .populate("kotIds")
      .populate("createdBy", "name role");
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ✅ LIST ORDERS BY BRANCH
export const listOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const branchId = req.user.branchId || req.query.branchId;

    if (!restaurantId) return res.status(400).json({ error: "restaurantId required" });

    const filter = { restaurantId };
    if (branchId) filter.branchId = branchId;

    const list = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("tableId")
      .populate("createdBy", "name role");

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ✅ STATUS UPDATE
export const updateStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Free table if order finished or cancelled
    if (order.tableId && ["completed", "cancelled"].includes(order.status)) {
      await Table.findByIdAndUpdate(order.tableId, { status: "available", currentOrder: null });
    }

    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ✅ ADD PAYMENT
export const addPayment = async (req, res) => {
  try {
    const { method, amount, status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.payments.push({ method, amount, status });
    await order.save();
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// ✅ UPDATED: UPDATE ORDER (e.g., add or update items in existing order)
export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;  // From URL: /orders/:orderId
    const { items: newItems = [], status } = req.body;  // Payload: new items to add/update, optional status
    const staffId = req.user._id;  // From auth (staff/owner making the update)

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required in the URL." });
    }

    const order = await Order.findById(orderId).populate('items.menuItem');  // Populate for validation
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.status !== "pending" && order.status !== "occupied") {
      return res.status(400).json({ error: "Order is not in an updatable state." });
    }

    let netAddedItems = [];  // Track net additions for inventory

    if (newItems && Array.isArray(newItems) && newItems.length > 0) {
      const newItemDocs = await Promise.all(
        newItems.map(async (i) => {
          const menuItem = await MenuItem.findById(i._id);
          if (!menuItem) throw new Error(`Menu item not found: ${i._id}`);
          if (!menuItem.isAvailable) throw new Error(`Menu item unavailable: ${menuItem.name}`);
          return { 
            menuItem: menuItem._id, 
            name: menuItem.name, 
            qty: i.quantity || 1,  // Use quantity from payload
            price: menuItem.price 
          };
        })
      );

      newItemDocs.forEach((newItem) => {
        const existingItemIndex = order.items.findIndex(item => item.menuItem.toString() === newItem.menuItem.toString());
        if (existingItemIndex !== -1) {
          // Update existing item quantity
          const existingItem = order.items[existingItemIndex];
          const originalQty = existingItem.qty;
          order.items[existingItemIndex].qty += newItem.qty;  // Increment quantity
          netAddedItems.push({ ...newItem, netQty: newItem.qty });  // Track for inventory (full added qty)
        } else {
          // Add new item
          order.items.push(newItem);
          netAddedItems.push(newItem);  // Track for inventory
        }
      });

      // Recalculate totals after updates
      const totals = computeTotals(order.items, order.taxRate || 0, order.discount || 0);
      order.subtotal = totals.subtotal;
      order.tax = totals.tax;
      order.total = totals.total;

      // Deduct inventory for net added quantities
      await deductInventoryForOrder({ items: netAddedItems });  // Only for newly added or updated items
    }

    // // Handle status update if provided
    // if (status && ['pending', 'preparing', 'ready', 'completed'].includes(status)) {
    //   order.status = status;
    //   if (status === 'completed' && order.tableId) {
    //     await Table.findByIdAndUpdate(order.tableId, { status: "available", currentOrder: null });
    //   }
    // }

    order.updatedBy = staffId;  // Track who updated
    await order.save();

    res.status(200).json({ success: true, data: order, message: "Order updated successfully." });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ success: false, error: error.message || "Failed to update order." });
  }
};


//old code not with branch
// import Order from "../models/Order.js";
// import MenuItem from "../models/MenuItem.js";
// import InventoryItem from "../models/InventoryItem.js";
// import Table from "../models/Table.js";
// import kotModel from "../models/kotModel.js";

// const computeTotals = (items, taxRate = 0.05, discount = 0) => {
//   const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
//   const tax = +(subtotal * taxRate).toFixed(2);
//   const total = +(subtotal + tax - discount).toFixed(2);
//   return { subtotal, tax, discount, total };
// };

// const deductInventoryForOrder = async (order) => {
//   for (const oi of order.items) {
//     const menu = await MenuItem.findById(oi.menuItem).populate("ingredients.inventoryItem");
//     if (!menu) continue;
//     for (const ing of (menu.ingredients || [])) {
//       const needed = (ing.qty || 0) * oi.qty;
//       if (!ing.inventoryItem) continue;
//       await InventoryItem.findByIdAndUpdate(ing.inventoryItem._id, { $inc: { quantity: -needed } });
//     }
//   }
// };

// export const placeOrder = async (req, res) => {
//   try {
//     const { type, tableNo, tableId, customer, items, discount = 0, taxRate = 0 } = req.body;
//     const restaurantId = req.user.restaurantId || req.body.restaurantId;

//     const itemDocs = await Promise.all(items.map(async (i) => {
//       const m = await MenuItem.findById(i.menuItem);
//       if (!m) throw new Error("Menu item not found");
//       return { menuItem: m._id, name: m.name, qty: i.qty, price: m.price };
//     }));

//     const totals = computeTotals(itemDocs, taxRate, discount);
//     const orderPayload = {
//       restaurantId, type, tableNo, customer,
//       items: itemDocs, ...totals, status: "pending"
//     };
//     if (tableId) orderPayload.tableId = tableId;

//     const order = await Order.create(orderPayload);

//     // auto generate KOT
//     await kotModel.create({
//       orderId: order._id,
//       restaurantId,
//       tableId,
//       tableNo,
//       items: itemDocs.map(i => ({ menuItem: i.menuItem, name: i.name, qty: i.qty }))
//     });

//     // If dine-in and table provided, mark table as occupied
//     if (tableId && type === 'dine-in') {
//       await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
//     }

//     // Deduct inventory
//     await deductInventoryForOrder(order);

//     res.status(201).json(order);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const getOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id).populate("items.menuItem").populate("tableId");
//     if (!order) return res.status(404).json({ error: "Order not found" });
//     res.json(order);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const listOrders = async (req, res) => {
//   try {
//     const restaurantId = req.user.restaurantId || req.query.restaurantId;
//     const list = await Order.find({ restaurantId }).sort({ createdAt: -1 }).populate('tableId');
//     res.json(list);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// };

// export const updateStatus = async (req, res) => {
//   try {
//     const prev = await Order.findById(req.params.id);
//     const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     // If order finished or cancelled, free the table
//     if (order.tableId && ['completed','cancelled'].includes(order.status)) {
//       await Table.findByIdAndUpdate(order.tableId, { status: 'available' });
//     }

//     res.json(order);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };

// export const addPayment = async (req, res) => {
//   try {
//     const { method, amount, status } = req.body;
//     const order = await Order.findById(req.params.id);
//     if (!order) return res.status(404).json({ error: "Order not found" });
//     order.payments.push({ method, amount, status });
//     await order.save();
//     res.json(order);
//   } catch (e) {
//     res.status(400).json({ error: e.message });
//   }
// };
