import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const debtors = await ctx.db
      .query("debtors")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .collect();

    const debtByStatus = debtors.reduce((acc, debtor) => {
      acc[debtor.status] = (acc[debtor.status] || 0) + debtor.debtAmount;
      return acc;
    }, {} as Record<string, number>);

    const paymentsOverTime = debtors
      .filter(d => d.status === 'paid' || d.status === 'partial')
      .map(d => ({
        date: new Date(d._creationTime).toLocaleDateString(),
        amount: d.amountPaid || 0,
      }))
      .reduce((acc, payment) => {
        const existing = acc.find(p => p.date === payment.date);
        if (existing) {
          existing.amount += payment.amount;
        } else {
          acc.push(payment);
        }
        return acc;
      }, [] as { date: string; amount: number }[]);

    return {
      debtByStatus,
      paymentsOverTime,
    };
  },
});
