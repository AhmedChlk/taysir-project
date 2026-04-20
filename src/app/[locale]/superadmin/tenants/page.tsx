import { getAllTenantsAction } from "@/actions/superadmin.actions";
import SuperAdminTenantsView from "@/components/superadmin/SuperAdminTenantsView";
import { setRequestLocale } from "next-intl/server";

export default async function SuperAdminTenantsPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	const res = await getAllTenantsAction({});

	if (!res.success) {
		return (
			<div className="p-8 bg-red-50 text-red-600 rounded-[32px] border border-red-100">
				<h2 className="text-xl font-black mb-2">Erreur d&apos;accès</h2>
				<p>{res.error.message}</p>
			</div>
		);
	}

	return <SuperAdminTenantsView initialTenants={res.data} />;
}
