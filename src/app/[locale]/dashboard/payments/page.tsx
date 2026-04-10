import { getPayments, getStudents } from "@/services/api";
import PaymentsClientView from "@/components/dashboard/payments/PaymentsClientView";

// Le chemin exact que nous avons enfin trouvé !
import DashboardLayout from "@/components/layouts/DashboardLayout";

/**
 * Page de gestion des paiements (Server Component)
 * Récupère les données et les passe au composant client avec purification.
 */
export default async function PaymentsPage() {
  // Récupération des paiements et des étudiants
  const [payments, students] = await Promise.all([
    getPayments(),
    getStudents()
  ]);

  /**
   * PURIFICATION DES DONNÉES
   * Crucial pour Next.js 16 et Turbopack afin d'éviter l'erreur 
   * "Invalid Server Actions request" lors du passage du serveur au client.
   */
  const purifiedPayments = JSON.parse(JSON.stringify(payments || []));
  const purifiedStudents = JSON.parse(JSON.stringify(students || []));

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PaymentsClientView 
          initialPayments={purifiedPayments} 
          students={purifiedStudents} 
        />
      </div>
    </DashboardLayout>
  );
}