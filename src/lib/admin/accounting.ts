import { getSql } from '../db';

// ── helpers ──────────────────────────────────────────────────────────

async function sql() {
  const s = await getSql();
  if (!s) throw new Error('Database not available');
  return s;
}

export async function ensureAccountingTables() {
  const q = await sql();

  await q`
    CREATE TABLE IF NOT EXISTS order_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL,
      product_id text NOT NULL,
      quantity int NOT NULL DEFAULT 1,
      unit_price numeric(12,2) NOT NULL DEFAULT 0,
      total_price numeric(12,2) NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
  `;

  await q`
    CREATE TABLE IF NOT EXISTS refunds (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL,
      amount numeric(12,2) NOT NULL,
      reason text,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON refunds (order_id);
  `;

  await q`
    CREATE TABLE IF NOT EXISTS affiliate_payouts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      affiliate_id text NOT NULL,
      amount numeric(12,2) NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      period_start date,
      period_end date,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_idx ON affiliate_payouts (affiliate_id);
  `;
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
  const q = await sql();
  await ensureAccountingTables();

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000).toISOString();

  const [revenueYTD] = (await q`
    SELECT COALESCE(SUM(amount_cents), 0)::bigint AS total FROM orders WHERE created_at >= ${startOfYear}
  `).rows;

  const [revenueMonth] = (await q`
    SELECT COALESCE(SUM(amount_cents), 0)::bigint AS total FROM orders WHERE created_at >= ${startOfMonth}
  `).rows;

  const [revenueWeek] = (await q`
    SELECT COALESCE(SUM(amount_cents), 0)::bigint AS total FROM orders WHERE created_at >= ${startOfWeek}
  `).rows;

  const [orderStats] = (await q`
    SELECT COUNT(*)::int AS count,
           COALESCE(AVG(amount_cents), 0)::int AS avg_value
    FROM orders WHERE created_at >= ${startOfMonth}
  `).rows;

  const [refundStats] = (await q`
    SELECT COUNT(*)::int AS count,
           COALESCE(SUM(amount), 0)::numeric AS total
    FROM refunds WHERE created_at >= ${startOfMonth}
  `).rows;

  const paymentBreakdown = (await q`
    SELECT provider AS method,
           COUNT(*)::int AS count,
           COALESCE(SUM(amount_cents), 0)::bigint AS total
    FROM orders
    WHERE created_at >= ${startOfMonth}
    GROUP BY provider
    ORDER BY total DESC
  `).rows;

  const refundRate = orderStats.count > 0 ? (refundStats.count / orderStats.count) * 100 : 0;

  return {
    revenueYTD: Number(revenueYTD.total) / 100,
    revenueMonth: Number(revenueMonth.total) / 100,
    revenueWeek: Number(revenueWeek.total) / 100,
    orderCount: orderStats.count,
    avgOrderValue: orderStats.avg_value / 100,
    refundRate: Math.round(refundRate * 100) / 100,
    refundTotal: Number(refundStats.total),
    paymentBreakdown: paymentBreakdown.map((r: any) => ({
      method: r.method,
      count: r.count,
      total: Number(r.total) / 100,
    })),
  };
}

// ── orders (paginated) ───────────────────────────────────────────────

export async function getAccountingOrders(filters: Filters = {}) {
  const q = await sql();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;

  // Build date conditions
  const from = filters.dateRange?.from ?? '1970-01-01';
  const to = filters.dateRange?.to ?? '2099-12-31';
  const provider = filters.paymentMethod ?? null;

  let rows: any[], countRows: any[];

  if (provider) {
    rows = (await q`
      SELECT id, provider, provider_order_id AS "providerOrderId", email,
             amount_cents AS "amountCents", currency, autoship, created_at AS "createdAt"
      FROM orders
      WHERE created_at >= ${from} AND created_at <= ${to} AND provider = ${provider}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `).rows;
    countRows = (await q`
      SELECT COUNT(*)::int AS total FROM orders
      WHERE created_at >= ${from} AND created_at <= ${to} AND provider = ${provider}
    `).rows;
  } else {
    rows = (await q`
      SELECT id, provider, provider_order_id AS "providerOrderId", email,
             amount_cents AS "amountCents", currency, autoship, created_at AS "createdAt"
      FROM orders
      WHERE created_at >= ${from} AND created_at <= ${to}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `).rows;
    countRows = (await q`
      SELECT COUNT(*)::int AS total FROM orders
      WHERE created_at >= ${from} AND created_at <= ${to}
    `).rows;
  }

  return {
    orders: rows,
    total: countRows[0]?.total ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countRows[0]?.total ?? 0) / limit),
  };
}

// ── reports (date-range aggregation) ─────────────────────────────────

export async function getAccountingReports(from: string, to: string, granularity: 'day' | 'week' | 'month' = 'day') {
  const q = await sql();
  await ensureAccountingTables();

  const trunc = granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';

  const revenue = (await q`
    SELECT date_trunc(${trunc}, created_at) AS period,
           COUNT(*)::int AS orders,
           COALESCE(SUM(amount_cents), 0)::bigint AS revenue
    FROM orders
    WHERE created_at >= ${from} AND created_at <= ${to}
    GROUP BY period
    ORDER BY period
  `).rows;

  const refunds = (await q`
    SELECT date_trunc(${trunc}, created_at) AS period,
           COUNT(*)::int AS count,
           COALESCE(SUM(amount), 0)::numeric AS total
    FROM refunds
    WHERE created_at >= ${from} AND created_at <= ${to}
    GROUP BY period
    ORDER BY period
  `).rows;

  return {
    from,
    to,
    granularity,
    revenue: revenue.map((r: any) => ({
      period: r.period,
      orders: r.orders,
      revenue: Number(r.revenue) / 100,
    })),
    refunds: refunds.map((r: any) => ({
      period: r.period,
      count: r.count,
      total: Number(r.total),
    })),
  };
}

// ── export (CSV / PDF) ───────────────────────────────────────────────

export async function exportAccountingData(from: string, to: string, format: 'csv' | 'pdf') {
  const q = await sql();

  const rows = (await q`
    SELECT id, provider, provider_order_id, email, amount_cents, currency, autoship, created_at
    FROM orders
    WHERE created_at >= ${from} AND created_at <= ${to}
    ORDER BY created_at DESC
  `).rows;

  if (format === 'csv') {
    const header = 'ID,Provider,Provider Order ID,Email,Amount,Currency,Autoship,Created At\n';
    const body = rows.map((r: any) =>
      `${r.id},${r.provider},${r.provider_order_id},${r.email},${(r.amount_cents / 100).toFixed(2)},${r.currency},${r.autoship},${r.created_at}`
    ).join('\n');
    return { contentType: 'text/csv', data: header + body, filename: `accounting-${from}-to-${to}.csv` };
  }

  // PDF: return structured data for client-side PDF generation
  return {
    contentType: 'application/json',
    data: JSON.stringify({
      title: `Accounting Report ${from} to ${to}`,
      generated: new Date().toISOString(),
      orders: rows.map((r: any) => ({
        ...r,
        amount: (r.amount_cents / 100).toFixed(2),
      })),
      summary: {
        totalOrders: rows.length,
        totalRevenue: rows.reduce((s: number, r: any) => s + r.amount_cents, 0) / 100,
      },
    }),
    filename: `accounting-${from}-to-${to}.json`,
  };
}

// ── products (revenue per product) ───────────────────────────────────

export async function getProductRevenue(from?: string, to?: string) {
  const q = await sql();
  await ensureAccountingTables();

  const dateFrom = from ?? '1970-01-01';
  const dateTo = to ?? '2099-12-31';

  // Try order_items first; fall back to parsing orders.items jsonb
  const fromItems = (await q`
    SELECT oi.product_id,
           SUM(oi.quantity)::int AS units_sold,
           SUM(oi.total_price)::numeric AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= ${dateFrom} AND o.created_at <= ${dateTo}
    GROUP BY oi.product_id
    ORDER BY revenue DESC
  `).rows;

  if (fromItems.length > 0) {
    return fromItems.map((r: any) => ({
      productId: r.product_id,
      unitsSold: r.units_sold,
      revenue: Number(r.revenue),
    }));
  }

  // Fallback: parse items JSONB from orders table
  const ordersWithItems = (await q`
    SELECT items, amount_cents FROM orders
    WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo} AND items IS NOT NULL
  `).rows;

  const productMap = new Map<string, { units: number; revenue: number }>();
  for (const order of ordersWithItems) {
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

  return Array.from(productMap.entries()).map(([productId, data]) => ({
    productId,
    unitsSold: data.units,
    revenue: data.revenue,
  })).sort((a, b) => b.revenue - a.revenue);
}

// ── customers (LTV, repeat rate) ─────────────────────────────────────

export async function getCustomerMetrics(limit = 100) {
  const q = await sql();

  const customers = (await q`
    SELECT email,
           COUNT(*)::int AS order_count,
           COALESCE(SUM(amount_cents), 0)::bigint AS lifetime_value,
           MIN(created_at) AS first_order,
           MAX(created_at) AS last_order
    FROM orders
    GROUP BY email
    ORDER BY lifetime_value DESC
    LIMIT ${limit}
  `).rows;

  const [totals] = (await q`
    SELECT COUNT(DISTINCT email)::int AS total_customers,
           COUNT(*)::int AS total_orders
    FROM orders
  `).rows;

  const [repeatCustomers] = (await q`
    SELECT COUNT(*)::int AS count FROM (
      SELECT email FROM orders GROUP BY email HAVING COUNT(*) > 1
    ) sub
  `).rows;

  const repeatRate = totals.total_customers > 0
    ? (repeatCustomers.count / totals.total_customers) * 100
    : 0;

  return {
    totalCustomers: totals.total_customers,
    totalOrders: totals.total_orders,
    repeatRate: Math.round(repeatRate * 100) / 100,
    avgLTV: totals.total_customers > 0
      ? Math.round(customers.reduce((s: number, c: any) => s + Number(c.lifetime_value), 0) / totals.total_customers) / 100
      : 0,
    customers: customers.map((c: any) => ({
      email: c.email,
      orderCount: c.order_count,
      lifetimeValue: Number(c.lifetime_value) / 100,
      firstOrder: c.first_order,
      lastOrder: c.last_order,
    })),
  };
}

// ── refunds ──────────────────────────────────────────────────────────

export async function getRefunds(filters: Filters = {}) {
  const q = await sql();
  await ensureAccountingTables();

  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;
  const status = filters.status ?? null;

  let rows: any[], countRows: any[];

  if (status) {
    rows = (await q`
      SELECT r.*, o.email, o.amount_cents AS order_amount
      FROM refunds r LEFT JOIN orders o ON o.id = r.order_id
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `).rows;
    countRows = (await q`SELECT COUNT(*)::int AS total FROM refunds WHERE status = ${status}`).rows;
  } else {
    rows = (await q`
      SELECT r.*, o.email, o.amount_cents AS order_amount
      FROM refunds r LEFT JOIN orders o ON o.id = r.order_id
      ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `).rows;
    countRows = (await q`SELECT COUNT(*)::int AS total FROM refunds`).rows;
  }

  return {
    refunds: rows.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      email: r.email,
      amount: Number(r.amount),
      orderAmount: r.order_amount ? r.order_amount / 100 : null,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    })),
    total: countRows[0]?.total ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countRows[0]?.total ?? 0) / limit),
  };
}

export async function updateRefundStatus(id: string, status: 'approved' | 'rejected') {
  const q = await sql();
  await q`UPDATE refunds SET status = ${status} WHERE id = ${id}`;
}

// ── affiliates ───────────────────────────────────────────────────────

export async function getAffiliatePayouts(filters: Filters = {}) {
  const q = await sql();
  await ensureAccountingTables();

  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = (page - 1) * limit;
  const status = filters.status ?? null;

  let rows: any[], countRows: any[];

  if (status) {
    rows = (await q`
      SELECT * FROM affiliate_payouts WHERE status = ${status}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `).rows;
    countRows = (await q`SELECT COUNT(*)::int AS total FROM affiliate_payouts WHERE status = ${status}`).rows;
  } else {
    rows = (await q`
      SELECT * FROM affiliate_payouts
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `).rows;
    countRows = (await q`SELECT COUNT(*)::int AS total FROM affiliate_payouts`).rows;
  }

  const [totals] = (await q`
    SELECT COALESCE(SUM(amount), 0)::numeric AS total_paid,
           COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::numeric AS pending
    FROM affiliate_payouts
  `).rows;

  return {
    payouts: rows.map((r: any) => ({
      id: r.id,
      affiliateId: r.affiliate_id,
      amount: Number(r.amount),
      status: r.status,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      createdAt: r.created_at,
    })),
    totalPaid: Number(totals.total_paid),
    pendingAmount: Number(totals.pending),
    total: countRows[0]?.total ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countRows[0]?.total ?? 0) / limit),
  };
}
