import { redirect } from "next/navigation";

export default function LegacySellerManagementPage() {
  redirect("/admin/products");
}
