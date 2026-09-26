"use server";

import { requireAuthForAction } from "@/lib/auth/guard";
import { globalSearch, listCompanyOptions, listJobOptions } from "@/lib/db/queries";

export async function globalSearchAction(query: string) {
  await requireAuthForAction();
  return globalSearch(query);
}

export async function searchCompaniesAction(query: string) {
  await requireAuthForAction();
  return listCompanyOptions(query, 20);
}

export async function searchJobsAction(query: string) {
  await requireAuthForAction();
  return listJobOptions(query, 20);
}
