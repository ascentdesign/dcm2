/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as communications from "../communications.js";
import type * as crons from "../crons.js";
import type * as debtors from "../debtors.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as paymentPlans from "../paymentPlans.js";
import type * as reports from "../reports.js";
import type * as router from "../router.js";
import type * as scheduledEmails from "../scheduledEmails.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  communications: typeof communications;
  crons: typeof crons;
  debtors: typeof debtors;
  emails: typeof emails;
  http: typeof http;
  paymentPlans: typeof paymentPlans;
  reports: typeof reports;
  router: typeof router;
  scheduledEmails: typeof scheduledEmails;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
