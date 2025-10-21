import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const get = query({
  args: { debtorId: v.id("debtors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const debtor = await ctx.db.get(args.debtorId);
    if (!debtor || debtor.createdBy !== userId) {
      return null;
    }
    return debtor;
  },
});

export const list = query({
  args: { searchQuery: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let debtors = await ctx.db
      .query("debtors")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();

    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const query = args.searchQuery.toLowerCase();
      debtors = debtors.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.email.toLowerCase().includes(query)
      );
    }

    return debtors;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const debtors = await ctx.db
      .query("debtors")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    const totalDebt = debtors.reduce((sum, d) => sum + d.debtAmount, 0);
    const totalPaid = debtors.reduce((sum, d) => sum + (d.amountPaid || 0), 0);
    const overdue = debtors.filter((d) => d.status === "overdue").length;
    const pending = debtors.filter((d) => d.status === "pending").length;

    return {
      totalDebt,
      totalPaid,
      totalOutstanding: totalDebt - totalPaid,
      overdue,
      pending,
      total: debtors.length,
    };
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    debtAmount: v.number(),
    paymentDueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const status = args.paymentDueDate < now ? "overdue" : "pending";

    const debtorId = await ctx.db.insert("debtors", {
      name: args.name,
      email: args.email,
      debtAmount: args.debtAmount,
      paymentDueDate: args.paymentDueDate,
      status,
      notes: args.notes,
      createdBy: userId,
    });

    return debtorId;
  },
});

export const importDebtors = mutation({
  args: {
    debtors: v.array(
      v.object({
        name: v.string(),
        email: v.string(),
        debtAmount: v.number(),
        paymentDueDate: v.number(),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const ids = [];

    for (const debtor of args.debtors) {
      const status = debtor.paymentDueDate < now ? "overdue" : "pending";
      const id = await ctx.db.insert("debtors", {
        ...debtor,
        status,
        createdBy: userId,
      });
      ids.push(id);
    }

    return ids;
  },
});

export const updateStatus = mutation({
  args: {
    debtorId: v.id("debtors"),
    status: v.union(
      v.literal("pending"),
      v.literal("overdue"),
      v.literal("paid"),
      v.literal("partial")
    ),
    amountPaid: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const debtor = await ctx.db.get(args.debtorId);
    if (!debtor || debtor.createdBy !== userId) {
      throw new Error("Debtor not found");
    }

    await ctx.db.patch(args.debtorId, {
      status: args.status,
      amountPaid: args.amountPaid,
    });

    return null;
  },
});

export const deleteDebtor = mutation({
  args: {
    debtorId: v.id("debtors"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const debtor = await ctx.db.get(args.debtorId);
    if (!debtor || debtor.createdBy !== userId) {
      throw new Error("Debtor not found");
    }

    await ctx.db.delete(args.debtorId);
    return null;
  },
});

export const sendEmail = mutation({
  args: {
    debtorId: v.id("debtors"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const debtor = await ctx.db.get(args.debtorId);
    if (!debtor || debtor.createdBy !== userId) {
      throw new Error("Debtor not found");
    }

    await ctx.scheduler.runAfter(0, internal.emails.sendIndividualEmail, {
      debtorId: args.debtorId,
    });

    return null;
  },
});

export const sendBulkEmails = mutation({
  args: {
    debtorIds: v.array(v.id("debtors")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    for (const debtorId of args.debtorIds) {
      const debtor = await ctx.db.get(debtorId);
      if (!debtor || debtor.createdBy !== userId) {
        continue;
      }

      await ctx.scheduler.runAfter(0, internal.emails.sendIndividualEmail, {
        debtorId,
      });
    }

    return { count: args.debtorIds.length };
  },
});

export const markEmailSent = internalMutation({
  args: {
    debtorId: v.id("debtors"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.debtorId, {
      lastEmailSent: Date.now(),
    });
    return null;
  },
});

export const getOverdueDebtors = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const debtors = await ctx.db
      .query("debtors")
      .withIndex("by_status", (q) => q.eq("status", "overdue"))
      .collect();

    // Filter to only send emails once per day
    return debtors.filter(
      (d) => !d.lastEmailSent || d.lastEmailSent < oneDayAgo
    );
  },
});

export const getDebtorById = internalQuery({
  args: {
    debtorId: v.id("debtors"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.debtorId);
  },
});

export const initializeDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user already has debtors
    const existingDebtors = await ctx.db
      .query("debtors")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .first();

    if (existingDebtors) {
      return { created: false, message: "Demo data already exists" };
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const demoDebtors = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        debtAmount: 2500.0,
        paymentDueDate: now - 15 * oneDay, // 15 days overdue
        status: "overdue" as const,
        notes: "Initial invoice sent on Jan 15. Follow-up required.",
      },
      {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        debtAmount: 1200.5,
        paymentDueDate: now - 5 * oneDay, // 5 days overdue
        status: "overdue" as const,
        notes: "Promised payment by end of month.",
      },
      {
        name: "Michael Chen",
        email: "m.chen@example.com",
        debtAmount: 3750.0,
        paymentDueDate: now + 10 * oneDay, // Due in 10 days
        status: "pending" as const,
        notes: "Large account - priority client.",
      },
      {
        name: "Emily Rodriguez",
        email: "emily.r@example.com",
        debtAmount: 850.0,
        paymentDueDate: now + 3 * oneDay, // Due in 3 days
        status: "pending" as const,
      },
      {
        name: "David Thompson",
        email: "d.thompson@example.com",
        debtAmount: 5000.0,
        paymentDueDate: now - 30 * oneDay, // 30 days overdue
        status: "partial" as const,
        amountPaid: 2000.0,
        notes: "Partial payment received. Remaining balance due immediately.",
      },
      {
        name: "Lisa Anderson",
        email: "lisa.anderson@example.com",
        debtAmount: 1500.0,
        paymentDueDate: now - 45 * oneDay,
        status: "paid" as const,
        amountPaid: 1500.0,
        notes: "Paid in full on time.",
      },
      {
        name: "Robert Martinez",
        email: "r.martinez@example.com",
        debtAmount: 4200.0,
        paymentDueDate: now - 20 * oneDay,
        status: "overdue" as const,
        notes: "Multiple attempts to contact. Consider legal action.",
      },
      {
        name: "Jennifer Lee",
        email: "jennifer.lee@example.com",
        debtAmount: 950.75,
        paymentDueDate: now + 7 * oneDay,
        status: "pending" as const,
        notes: "New client - first invoice.",
      },
    ];

    for (const debtor of demoDebtors) {
      await ctx.db.insert("debtors", {
        ...debtor,
        createdBy: userId,
      });
    }

    return { created: true, count: demoDebtors.length };
  },
});
