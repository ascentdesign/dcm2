"use node";

import { internalAction } from "./_generated/server";
import { Resend } from "resend";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const sendReminderEmails = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: number }> => {
    const overdueDebtors: Array<{
      _id: any;
      _creationTime: number;
      name: string;
      email: string;
      debtAmount: number;
      paymentDueDate: number;
      status: "pending" | "overdue" | "paid" | "partial";
      amountPaid?: number;
      notes?: string;
      lastEmailSent?: number;
      createdBy: any;
    }> = await ctx.runQuery(
      internal.debtors.getOverdueDebtors
    );

    const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);

    for (const debtor of overdueDebtors) {
      try {
        const daysOverdue = Math.floor(
          (Date.now() - debtor.paymentDueDate) / (1000 * 60 * 60 * 24)
        );

        const { error } = await resend.emails.send({
          from: "Debt Collection <noreply@debtcollection.example.com>",
          to: debtor.email,
          subject: `Payment Reminder - ${daysOverdue} Days Overdue`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Payment Overdue Notice</h2>
              <p>Dear ${debtor.name},</p>
              <p>This is a reminder that your payment is now <strong>${daysOverdue} days overdue</strong>.</p>
              <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Amount Due:</strong> $${debtor.debtAmount.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(debtor.paymentDueDate).toLocaleDateString()}</p>
                ${debtor.amountPaid ? `<p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${debtor.amountPaid.toFixed(2)}</p>` : ""}
                ${debtor.amountPaid ? `<p style="margin: 5px 0;"><strong>Outstanding Balance:</strong> $${(debtor.debtAmount - debtor.amountPaid).toFixed(2)}</p>` : ""}
              </div>
              <p>Please arrange payment as soon as possible to avoid further action.</p>
              <p>If you have already made this payment, please disregard this notice.</p>
              <p>Best regards,<br/>Debt Collection Agency</p>
            </div>
          `,
        });

        if (error) {
          console.error(`Failed to send email to ${debtor.email}:`, error);
        } else {
          await ctx.runMutation(internal.debtors.markEmailSent, {
            debtorId: debtor._id,
          });
        }
      } catch (error) {
        console.error(`Error sending email to ${debtor.email}:`, error);
      }
    }

    return { sent: overdueDebtors.length };
  },
});

export const sendIndividualEmail = internalAction({
  args: {
    debtorId: v.id("debtors"),
  },
  handler: async (ctx, args) => {
    const debtor: {
      _id: any;
      _creationTime: number;
      name: string;
      email: string;
      debtAmount: number;
      paymentDueDate: number;
      status: "pending" | "overdue" | "paid" | "partial";
      amountPaid?: number;
      notes?: string;
      lastEmailSent?: number;
      createdBy: any;
    } | null = await ctx.runQuery(internal.debtors.getDebtorById, {
      debtorId: args.debtorId,
    });

    if (!debtor) {
      throw new Error("Debtor not found");
    }

    const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);

    const now = Date.now();
    const isOverdue = debtor.paymentDueDate < now;
    const daysOverdue = isOverdue
      ? Math.floor((now - debtor.paymentDueDate) / (1000 * 60 * 60 * 24))
      : 0;
    const daysUntilDue = !isOverdue
      ? Math.floor((debtor.paymentDueDate - now) / (1000 * 60 * 60 * 24))
      : 0;

    const subject = isOverdue
      ? `Payment Reminder - ${daysOverdue} Days Overdue`
      : `Payment Reminder - Due in ${daysUntilDue} Days`;

    const { error } = await resend.emails.send({
      from: "Debt Collection <noreply@debtcollection.example.com>",
      to: debtor.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isOverdue ? "#dc2626" : "#2563eb"};">${isOverdue ? "Payment Overdue Notice" : "Payment Reminder"}</h2>
          <p>Dear ${debtor.name},</p>
          <p>${
            isOverdue
              ? `This is a reminder that your payment is now <strong>${daysOverdue} days overdue</strong>.`
              : `This is a friendly reminder that your payment is due in <strong>${daysUntilDue} days</strong>.`
          }</p>
          <div style="background-color: ${isOverdue ? "#fee2e2" : "#dbeafe"}; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount Due:</strong> $${debtor.debtAmount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(debtor.paymentDueDate).toLocaleDateString()}</p>
            ${debtor.amountPaid ? `<p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${debtor.amountPaid.toFixed(2)}</p>` : ""}
            ${debtor.amountPaid ? `<p style="margin: 5px 0;"><strong>Outstanding Balance:</strong> $${(debtor.debtAmount - debtor.amountPaid).toFixed(2)}</p>` : ""}
          </div>
          <p>${
            isOverdue
              ? "Please arrange payment as soon as possible to avoid further action."
              : "Please ensure payment is made by the due date to avoid any late fees or penalties."
          }</p>
          <p>If you have already made this payment, please disregard this notice.</p>
          <p>Best regards,<br/>Debt Collection Agency</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }

    await ctx.runMutation(internal.debtors.markEmailSent, {
      debtorId: args.debtorId,
    });

    return { success: true };
  },
});

export const processScheduledEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    const schedules: Array<{
      _id: any;
      debtorIds: Array<any>;
      scheduledFor: number;
      status: string;
      createdBy: any;
    }> = await ctx.runQuery(internal.scheduledEmails.getPendingSchedules);

    for (const schedule of schedules) {
      await ctx.runMutation(internal.scheduledEmails.markScheduleProcessing, {
        scheduleId: schedule._id,
      });

      let sentCount = 0;
      let failedCount = 0;

      for (const debtorId of schedule.debtorIds) {
        try {
          await ctx.runAction(internal.emails.sendIndividualEmail, {
            debtorId,
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send email for debtor ${debtorId}:`, error);
          failedCount++;
        }
      }

      await ctx.runMutation(internal.scheduledEmails.markScheduleCompleted, {
        scheduleId: schedule._id,
        sentCount,
        failedCount,
      });
    }

    return { processed: schedules.length };
  },
});
