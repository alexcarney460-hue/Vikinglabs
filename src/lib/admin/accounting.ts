import { getSupabase } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// ── helpers ──────────────────────────────────────────────────────────

function sb(): SupabaseClient {
  const s = getSupabase();
  if (!s) throw new Error('Supabase not configured');
  return s;
}

// ── types ────────────────────────────────────────────────────────────

export type DateRange = { from: string; to: string };
export type Filters = {
  dateRange?: DateRange;
  paymentMethod?: string;
  status?: string;
  page?: number;
  limit?: number;
};

// ── summary ──────────────────────────────────────────────────────────

export async function getAccountingSummary() {
  const supabase = sb();

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000).toISOString();

  // Revenue YTD
  const { data: ytdOrders } = await supabase
    .from('orders')
    .select('amount_cents')
    .gte('created_at', startOfYear);
  const revenueYTD = (ytdOrders || []).reduce((s, r) => s + Number(r.amount_cents), 0) / 100;

  // Revenue this month
  const { data: monthOrders } = await supabase
    .from('orders')
    .select('amount_cents')
    .gte('created_at', startOfMonth);
  const revenueMonth = (monthOrders || []).reduce((s, r) => s + Number(r.amount_cents), 0) / 100;

  // Revenue this week
  const { data: weekOrders } = await supabase
    .from('orders')
    .select('amount_cents')
    .gte('created_at', startOfWeek);
  const revenueWeek = (weekOrders || []).reduce((s, r) => s + Number(r.amount_cents), 0) / 100;

  // Order stats this month
  const orderCount = (monthOrders || []).length;
  const avgOrderValue = orderCount > 0
    ? (monthOrders || []).reduce((s, r) => s + Number(r.amount_cents), 0) / orderCount / 100
    : 0;

  // Refund stats this month
  const { data: monthRefunds } = await supabase
    .from('refunds')
    .select('amount')
    .gte('created_at', startOfMonth);
  const refundCount = (monthRefunds || []).length;
  const refundTotal = (monthRefunds || []).reduce((s, r) => s + Number(r.amount), 0);
  const refundRate = orderCount > 0 ? (refundCount / orderCount) * 100 : 0;

  // Payment breakdown this month
  const { data: allMonthOrders } = await supabase
    .from('orders')
    .select('provider, amount_cents')
    .gte('created_at', startOfMonth);

  const breakdownMap = new Map<string, { count: number; total: number }>();
  for (const o of allMonthOrders || []) {
    const existing = breakdownMap.get(o.provider) || { count: 0, total: 0 };
    existing.count++;
    existing.total += Number(o.amount_cents);
    breakdownMap.set(o.provider, existing);
  }

  const paymentBreakdown = Array.from(breakdownMap.entries())
    .map(([method, data]) => ({ method, count: data.count, total: data.total / 100 }))
    .sort((a, b) => b.total - a.total);

  return {
    revenueYTD,
    revenueMonth,
    revenueWeek,
    orderCount,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    refundRate: Math.round(refundRate * 100) / 100,
    refundTotal,
    paymentBreakdown,
  };
}

// ── orders (paginated) ───────────────────────────────────────────────

export async function getAccountingOrders(filters: Filters = {}) {
  const supabase = sb();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  const from = filters.dateRange?.from ?? '1970-01-01';
  const to = filters.dateRange?.to ?? '2099-12-31';

  let query = supabase
    .from('orders')
    .select('id, provider, provider_order_id, email, amount_cents, currency, autoship, created_at', { count: 'exact' })
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.paymentMethod) {
    query = query.eq('provider', filters.paymentMethod);
  }

  const { data: rows, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    orders: (rows || []).map((r: any) => ({
      id: r.id,
      provider: r.provider,
      providerOrderId: r.provider_order_id,
      email: r.email,
      amountCents: r.amount_cents,
      currency: r.currency,
      autoship: r.autoship,
      createdAt: r.created_at,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ── reports (date-range aggregation) ─────────────────────────────────

export async function getAccountingReports(from: string, to: string, granularity: 'day' | 'week' | 'month' = 'day') {
  const supabase = sb();

  // Fetch all orders in range
  const { data: orders } = await supabase
    .from('orders')
    .select('amount_cents, created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: true });

  // Fetch refunds in range
  const { data: refunds } = await supabase
    .from('refunds')
    .select('amount, created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: true });

  // Group by period
  function truncDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (granularity === 'day') return d.toISOString().slice(0, 10);
    if (granularity === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day;
      const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
      return weekStart.toISOString().slice(0, 10);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  const revenueMap = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders || []) {
    const period = truncDate(o.created_at);
    const existing = revenueMap.get(period) || { orders: 0, revenue: 0 };
    existing.orders++;
    existing.revenue += Number(o.amount_cents);
    revenueMap.set(period, existing);
  }

  const refundMap = new Map<string, { count: number; total: number }>();
  for (const r of refunds || []) {
    const period = truncDate(r.created_at);
    const existing = refundMap.get(period) || { count: 0, total: 0 };
    existing.count++;
    existing.total += Number(r.amount);
    refundMap.set(period, existing);
  }

  return {
    from,
    to,
    granularity,
    revenue: Array.from(revenueMap.entries())
      .map(([period, data]) => ({ period, orders: data.orders, revenue: data.revenue / 100 }))
      .sort((a, b) => a.period.localeCompare(b.period)),
    refunds: Array.from(refundMap.entries())
      .map(([period, data]) => ({ period, count: data.count, total: data.total }))
      .sort((a, b) => a.period.localeCompare(b.period)),
  };
}

// ── export (CSV / PDF) ───────────────────────────────────────────────

export async function exportAccountingData(from: string, to: string, format: 'csv' | 'pdf') {
  const supabase = sb();

  const { data: rows } = await supabase
    .from('orders')
    .select('id, provider, provider_order_id, email, amount_cents, currency, autoship, created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false });

  const orders = rows || [];

  if (format === 'csv') {
    const header = 'ID,Provider,Provider Order ID,Email,Amount,Currency,Autoship,Created At\n';
    const body = orders.map((r: any) =>
      `${r.id},${r.provider},${r.provider_order_id},${r.email},${(r.amount_cents / 100).toFixed(2)},${r.currency},${r.autoship},${r.created_at}`
    ).join('\n');
    return { contentType: 'text/csv', data: header + body, filename: `accounting-${from}-to-${to}.csv` };
  }

  return {
    contentType: 'application/json',
    data: JSON.stringify({
      title: `Accounting Report ${from} to ${to}`,
      generated: new Date().toISOString(),
      orders: orders.map((r: any) => ({ ...r, amount: (r.amount_cents / 100).toFixed(2) })),
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s: number, r: any) => s + r.amount_cents, 0) / 100,
      },
    }),
    filename: `accounting-${from}-to-${to}.json`,
  };
}

// ── products (revenue per product) ───────────────────────────────────

export async function getProductRevenue(from?: string, to?: string) {
  const supabase = sb();
  const dateFrom = from ?? '1970-01-01';
  const dateTo = to ?? '2099-12-31';

  // Try order_items first
  const { data: itemRows } = await supabase
    .from('order_items')
    .select('product_id, quantity, total_price, order_id')
    .order('total_price', { ascending: false });

  // Filter by date via orders join — since Supabase doesn't support cross-table filters easily,
  // we'll fetch orders in range and filter items by order_id
  if (itemRows && itemRows.length > 0) {
    const { data: ordersInRange } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    const orderIds = new Set((ordersInRange || []).map(o => o.id));
    const filtered = itemRows.filter(i => orderIds.has(i.order_id));

    const productMap = new Map<string, { units: number; revenue: number }>();
    for (const item of filtered) {
      const existing = productMap.get(item.product_id) || { units: 0, revenue: 0 };
      existing.units += item.quantity;
      existing.revenue += Number(item.total_price);
      productMap.set(item.product_id, existing);
    }

    return Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, unitsSold: data.units, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  // Fallback: parse items JSONB from orders table
  const { data: ordersWithItems } = await supabase
    .from('orders')
    .select('items, amount_cents')
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)
    .not('items', 'is', null);

  const productMap = new Map<string, { units: number; revenue: number }>();
  for (const order of ordersWithItems || []) {
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items)) {
        for (const item of items) {
          const key = item.product_id || item.productId || item.name || 'unknown';
          const existing = productMap.get(key) || { units: 0, revenue: 0 };
          existing.units += item.quantity || 1;
          existing.revenue += (item.price || item.amount || 0) / 100;
          productMap.set(key, existing);
        }
      }
    } catch { /* skip malformed */ }
  }

  return Array.from(productMap.entries())
    .map(([productId, data]) => ({ productId, unitsSold: data.units, revenue: data.revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ── customers (LTV, repeat rate) ─────────────────────────────────────

export async function getCustomerMetrics(limit = 100) {
  const supabase = sb();

  // Fetch all orders (for aggregation)
  const { data: allOrders } = await supabase
    .from('orders')
    .select('email, amount_cents, created_at')
    .order('created_at', { ascending: false });

  const orders = allOrders || [];

  // Aggregate by email
  const customerMap = new Map<string, {
    orderCount: number;
    lifetimeValue: number;
    firstOrder: string;
    lastOrder: string;
  }>();

  for (const o of orders) {
    const existing = customerMap.get(o.email) || {
      orderCount: 0, lifetimeValue: 0,
      firstOrder: o.created_at, lastOrder: o.created_at,
    };
    existing.orderCount++;
    existing.lifetimeValue += Number(o.amount_cents);
    if (o.created_at < existing.firstOrder) existing.firstOrder = o.created_at;
    if (o.created_at > existing.lastOrder) existing.lastOrder = o.created_at;
    customerMap.set(o.email, existing);
  }

  const totalCustomers = customerMap.size;
  const totalOrders = orders.length;
  const repeatCustomers = Array.from(customerMap.values()).filter(c => c.orderCount > 1).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  const customers = Array.from(customerMap.entries())
    .map(([email, data]) => ({
      email,
      orderCount: data.orderCount,
      lifetimeValue: data.lifetimeValue / 100,
      firstOrder: data.firstOrder,
      lastOrder: data.lastOrder,
    }))
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
    .slice(0, limit);

  const avgLTV = totalCustomers > 0
    ? customers.reduce((s, c) => s + c.lifetimeValue, 0) / totalCustomers
    : 0;

  return {
    totalCustomers,
    totalOrders,
    repeatRate: Math.round(repeatRate * 100) / 100,
    avgLTV: Math.round(avgLTV * 100) / 100,
    customers,
  };
}

// ── refunds ──────────────────────────────────────────────────────────

export async function getRefunds(filters: Filters = {}) {
  const supabase = sb();

  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('refunds')
    .select('id, order_id, amount, reason, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data: refundRows, count, error } = await query;
  if (error) throw new Error(error.message);

  // Get order emails for the refunds
  const orderIds = [...new Set((refundRows || []).map(r => r.order_id))];
  const { data: orderRows } = orderIds.length > 0
    ? await supabase.from('orders').select('id, email, amount_cents').in('id', orderIds)
    : { data: [] };

  const orderMap = new Map((orderRows || []).map(o => [o.id, o]));
  const total = count ?? 0;

  return {
    refunds: (refundRows || []).map((r: any) => {
      const order = orderMap.get(r.order_id);
      return {
        id: r.id,
        orderId: r.order_id,
        email: order?.email ?? null,
        amount: Number(r.amount),
        orderAmount: order ? order.amount_cents / 100 : null,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateRefundStatus(id: string, status: 'approved' | 'rejected') {
  const supabase = sb();
  const { error } = await supabase.from('refunds').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── affiliates ───────────────────────────────────────────────────────

export async function getAffiliatePayouts(filters: Filters = {}) {
  const supabase = sb();

  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('affiliate_payouts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data: rows, count, error } = await query;
  if (error) throw new Error(error.message);

  // Get totals
  const { data: allPayouts } = await supabase
    .from('affiliate_payouts')
    .select('amount, status');

  const totalPaid = (allPayouts || []).reduce((s, r) => s + Number(r.amount), 0);
  const pendingAmount = (allPayouts || [])
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + Number(r.amount), 0);

  const total = count ?? 0;

  return {
    payouts: (rows || []).map((r: any) => ({
      id: r.id,
      affiliateId: r.affiliate_id,
      amount: Number(r.amount),
      status: r.status,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      createdAt: r.created_at,
    })),
    totalPaid,
    pendingAmount,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ── ensureAccountingTables (no-op for Supabase — tables created via migration) ──

export async function ensureAccountingTables() {
  // Tables are created via SQL migration in Supabase Dashboard.
  // This is a no-op to maintain backward compatibility.
}
