import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ locale: string }>; 
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/${locale}/login`);
  }
  
  return <>{children}</>;
}
