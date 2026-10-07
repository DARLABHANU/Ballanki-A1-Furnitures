import { redirect } from "next/navigation";

/** Merchant accounts and the seller portal are no longer part of this store. */
export default function MerchantLayout() {
  redirect("/");
}
