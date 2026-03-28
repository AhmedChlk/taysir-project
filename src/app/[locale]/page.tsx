import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();
  
  if (!session) {
    redirect(`/${locale}/login`);
  } else {
    redirect(`/${locale}/dashboard`);
  }
}
