import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const scheduleEmails = mutation({
  args: {
    debtorIds: v.array(v.id("debtors")),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    for (const debtorId of args.debtorIds) {
      const debtor = await ctx.db.get(debtorId);
      if (!debtor || debtor.createdBy !== userId) {
        throw new Error("Unauthorized access to debtor");
      }
    }

    const scheduleId = await ctx.db.insert("scheduledEmails", {
      debtorIds: args.debtorIds,
      scheduledFor: args.scheduledFor,
      status: "pending",
      createdBy: userId,
    });

    return scheduleId;
  },
});

export const listScheduled = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const scheduled = await ctx.db
      .query("scheduledEmails")
      .withIndex("by_created_by", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();

    return scheduled;
  },
});

export const cancelScheduled = mutation({
  args: {
    scheduleId: v.id("scheduledEmails"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule || schedule.createdBy !== userId) {
      throw new Error("Schedule not found");
    }

    if (schedule.status !== "pending") {
      throw new Error("Cannot cancel a schedule that is not pending");
    }

    await ctx.db.delete(args.scheduleId);
    return null;
  },
});

export const getPendingSchedules = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const schedules = await ctx.db
      .query("scheduledEmails")
      .withIndex("by_status_and_scheduled", (q) => 
        q.eq("status", "pending").lt("scheduledFor", now)
      )
      .collect();

    return schedules;
  },
});

export const markScheduleProcessing = internalMutation({
  args: {
    scheduleId: v.id("scheduledEmails"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      status: "processing",
    });
    return null;
  },
});

export const markScheduleCompleted = internalMutation({
  args: {
    scheduleId: v.id("scheduledEmails"),
    sentCount: v.number(),
    failedCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      status: "completed",
      sentCount: args.sentCount,
      failedCount: args.failedCount,
    });
    return null;
  },
});
