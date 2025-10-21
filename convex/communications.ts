import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const add = mutation({
  args: {
    debtorId: v.id("debtors"),
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("note"),
      v.literal("letter")
    ),
    content: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
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

    await ctx.db.insert("communications", {
      ...args,
      createdBy: userId,
    });

    return null;
  },
});

export const listForDebtor = query({
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

    const communications = await ctx.db
      .query("communications")
      .withIndex("by_debtorId", (q) => q.eq("debtorId", args.debtorId))
      .order("desc")
      .collect();

    const communicationsWithDetails = await Promise.all(
      communications.map(async (comm) => {
        const user = await ctx.db.get(comm.createdBy);
        const fileUrl = comm.fileId ? await ctx.storage.getUrl(comm.fileId) : null;
        return {
          ...comm,
          author: user?.name ?? "Unknown User",
          fileUrl,
        };
      })
    );

    return communicationsWithDetails;
  },
});
