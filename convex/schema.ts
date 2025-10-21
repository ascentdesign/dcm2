import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  debtors: defineTable({
    name: v.string(),
    email: v.string(),
    debtAmount: v.number(),
    paymentDueDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("overdue"),
      v.literal("paid"),
      v.literal("partial")
    ),
    amountPaid: v.optional(v.number()),
    notes: v.optional(v.string()),
    lastEmailSent: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_status", ["status"])
    .index("by_due_date", ["paymentDueDate"])
    .index("by_created_by", ["createdBy"])
    .searchIndex("search_name", { searchField: "name" }),
  scheduledEmails: defineTable({
    debtorIds: v.array(v.id("debtors")),
    scheduledFor: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdBy: v.id("users"),
    sentCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
  })
    .index("by_status_and_scheduled", ["status", "scheduledFor"])
    .index("by_created_by", ["createdBy"]),
  communications: defineTable({
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
    createdBy: v.id("users"),
  }).index("by_debtorId", ["debtorId"]),
  paymentPlans: defineTable({
    debtorId: v.id("debtors"),
    installments: v.array(
      v.object({
        amount: v.number(),
        dueDate: v.number(),
        paid: v.boolean(),
      })
    ),
    status: v.string(),
    createdBy: v.id("users"),
  }).index("by_debtorId", ["debtorId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
