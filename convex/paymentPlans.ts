import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getForDebtor = query({
  args: { debtorId: v.id("debtors") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db
      .query("paymentPlans")
      .withIndex("by_debtorId", (q) => q.eq("debtorId", args.debtorId))
      .first();
  },
});

export const create = mutation({
  args: {
    debtorId: v.id("debtors"),
    installments: v.number(),
    startDate: v.number(),
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

    const installmentAmount = debtor.debtAmount / args.installments;
    const installments = [];
    for (let i = 0; i < args.installments; i++) {
      installments.push({
        amount: installmentAmount,
        dueDate: args.startDate + i * 30 * 24 * 60 * 60 * 1000, // Monthly installments
        paid: false,
      });
    }

    await ctx.db.insert("paymentPlans", {
      debtorId: args.debtorId,
      installments,
      status: "active",
      createdBy: userId,
    });
  },
});
