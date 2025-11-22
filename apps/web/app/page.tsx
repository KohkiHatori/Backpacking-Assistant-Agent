import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";
import { getUserTrips } from "./actions";
import Dashboard from "../components/dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth");
  }

  const trips = await getUserTrips(session.user.id);

  return <Dashboard trips={trips} user={session.user} />;
}
