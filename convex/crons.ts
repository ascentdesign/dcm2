import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "send reminder emails",
  { hours: 24 },
  internal.emails.sendReminderEmails,
  {}
);

crons.interval(
  "process scheduled emails",
  { minutes: 5 },
  internal.emails.processScheduledEmails,
  {}
);

export default crons;
