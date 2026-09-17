import { loadVehicles } from "@/lib/store";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const vehicles = await loadVehicles();
  return <Dashboard initialVehicles={vehicles} />;
}
