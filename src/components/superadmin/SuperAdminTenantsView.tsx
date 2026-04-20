"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Building2, Globe, Palette, Users, GraduationCap, ExternalLink, ShieldAlert, CheckCircle2, XCircle, Mail, User, Lock } from "lucide-react";
import { createTenantAction, deleteTenantAction, toggleTenantStatusAction } from "@/actions/superadmin.actions";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { clsx } from "clsx";

interface Tenant {
	id: string;
	name: string;
	slug: string;
    isActive: boolean;
	primaryColor: string | null;
	createdAt: Date;
	_count: {
		users: number;
		students: number;
	};
}

interface SuperAdminTenantsViewProps {
	initialTenants: Tenant[];
}

export default function SuperAdminTenantsView({ initialTenants }: SuperAdminTenantsViewProps) {
	const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
    const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
        setError(null);
		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name") as string,
			slug: formData.get("slug") as string,
			primaryColor: formData.get("primaryColor") as string,
            manager: {
                email: formData.get("managerEmail") as string,
                firstName: formData.get("managerFirstName") as string,
                lastName: formData.get("managerLastName") as string,
                password: formData.get("managerPassword") as string,
            }
		};

		startTransition(async () => {
			const res = await createTenantAction(data);
			if (res.success) {
				window.location.reload();
			} else {
				setError(res.error.message);
			}
		});
	};

	const handleToggleStatus = async (tenant: Tenant) => {
        setError(null);
		startTransition(async () => {
			const res = await toggleTenantStatusAction({ 
                id: tenant.id, 
                isActive: !tenant.isActive 
            });
			if (res.success) {
				setTenants(tenants.map(t => t.id === tenant.id ? { ...t, isActive: !t.isActive } : t));
			} else {
				setError(res.error.message);
			}
		});
	};

	const handleDeleteTenant = async () => {
		if (!tenantToDelete) return;
        setError(null);

		startTransition(async () => {
			const res = await deleteTenantAction({ id: tenantToDelete.id });
			if (res.success) {
				setTenants(tenants.filter((t) => t.id !== tenantToDelete.id));
				setTenantToDelete(null);
			} else {
				setError(res.error.message);
                setTenantToDelete(null);
			}
		});
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-black text-gray-900 tracking-tight">
						Parc <span className="text-taysir-teal">Établissements</span>
					</h1>
					<p className="text-gray-500 font-medium mt-1">
						Déployez et pilotez les accès de vos clients.
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
                        setError(null);
                        setIsCreateModalOpen(true);
                    }}
					className="btn-primary flex items-center gap-2 shadow-lg shadow-taysir-teal/20 self-start"
				>
					<Plus size={20} />
					Nouveau Client
				</button>
			</div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 shadow-sm">
                    <ShieldAlert size={18} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
                        <XCircle size={18} />
                    </button>
                </div>
            )}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{tenants.map((tenant) => (
					<div
						key={tenant.id}
						className={clsx(
                            "group bg-white rounded-[32px] border p-6 transition-all duration-500 relative overflow-hidden flex flex-col",
                            tenant.isActive 
                                ? "border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50" 
                                : "border-red-100 bg-red-50/10 grayscale-[0.5]"
                        )}
					>
						{/* Accent color bar */}
						<div
							className="absolute top-0 left-0 right-0 h-1.5"
							style={{ backgroundColor: tenant.isActive ? (tenant.primaryColor || "#0F515C") : "#EF4444" }}
						/>

						<div className="flex items-start justify-between mb-6">
							<div className={clsx(
                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-500 border shadow-sm",
                                tenant.isActive ? "bg-gray-50 text-taysir-teal border-gray-100" : "bg-red-50 text-red-500 border-red-100"
                            )}>
								<Building2 size={28} strokeWidth={1.5} />
							</div>
							<div className="flex gap-1">
								<button
									type="button"
                                    onClick={() => handleToggleStatus(tenant)}
									className={clsx(
                                        "p-2 rounded-xl transition-all",
                                        tenant.isActive 
                                            ? "text-gray-400 hover:text-red-500 hover:bg-red-50" 
                                            : "text-red-500 hover:text-emerald-500 hover:bg-emerald-50"
                                    )}
									title={tenant.isActive ? "Désactiver l'accès" : "Activer l'accès"}
								>
									{tenant.isActive ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
								</button>
								<button
									type="button"
									onClick={() => setTenantToDelete(tenant)}
									className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all"
									title="Supprimer définitivement"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</div>

						<div className="mb-6">
                            <div className="flex items-center gap-2 mb-1">
							    <h3 className="text-xl font-black text-gray-900 line-clamp-1">{tenant.name}</h3>
                                {!tenant.isActive && (
                                    <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">Coupé</span>
                                )}
                            </div>
							<div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
								<Globe size={12} />
								{tenant.slug}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 mt-auto">
							<div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
								<div className="flex items-center gap-2 text-gray-400 mb-1">
									<Users size={14} />
									<span className="text-[10px] font-black uppercase tracking-wider">Staff</span>
								</div>
								<span className="text-lg font-black text-gray-900">{tenant._count.users}</span>
							</div>
							<div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
								<div className="flex items-center gap-2 text-gray-400 mb-1">
									<GraduationCap size={14} />
									<span className="text-[10px] font-black uppercase tracking-wider">Élèves</span>
								</div>
								<span className="text-lg font-black text-gray-900">{tenant._count.students}</span>
							</div>
						</div>
                        
                        <button
                            type="button"
                            onClick={() => window.open(`/${tenant.slug}/dashboard`, '_blank')}
                            disabled={!tenant.isActive}
                            className="mt-6 w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ExternalLink size={16} />
                            Ouvrir l&apos;instance
                        </button>
					</div>
				))}
			</div>

			{/* Modal Création - ÉVOLUÉ : Tenant + Gérant */}
			<Modal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				title="Déploiement d&apos;une nouvelle instance"
			>
				<form onSubmit={handleCreateTenant} className="space-y-8 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
					{/* Section Établissement */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-taysir-teal font-black text-xs uppercase tracking-[0.2em] mb-4">
                            <Building2 size={16} />
                            Information Client
                        </div>
                        <Input
                            label="Nom de l'école / entreprise"
                            name="name"
                            placeholder="ex: École les Glycines"
                            required
                        />
                        <Input
                            label="Slug (URL unique)"
                            name="slug"
                            placeholder="ex: glycines"
                            required
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                <Palette size={16} className="text-taysir-teal" />
                                Identité Visuelle
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    name="primaryColor"
                                    defaultValue="#0F515C"
                                    className="h-12 w-24 rounded-xl cursor-pointer border-2 border-gray-100 p-1"
                                />
                                <span className="text-xs font-bold text-gray-400 italic">Couleur thème dashboard.</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full" />

                    {/* Section Gérant Initial */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-[0.2em] mb-4">
                            <ShieldAlert size={16} />
                            Compte Gérant Initial
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Prénom"
                                name="managerFirstName"
                                placeholder="Prénom"
                                required
                            />
                            <Input
                                label="Nom"
                                name="managerLastName"
                                placeholder="Nom"
                                required
                            />
                        </div>
                        <Input
                            label="Email de connexion"
                            name="managerEmail"
                            type="email"
                            placeholder="manager@ecole.com"
                            required
                        />
                        <Input
                            label="Mot de passe provisoire"
                            name="managerPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                        />
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                            Ce compte aura les pleins pouvoirs (GERANT) sur l&apos;instance créée. Communiquez ces identifiants au client après le déploiement.
                        </p>
                    </div>

					<div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white">
						<button
							type="button"
							onClick={() => setIsCreateModalOpen(false)}
							className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
						>
							Annuler
						</button>
						<SubmitButton isLoading={isPending} className="px-8 rounded-2xl">
							Lancer le déploiement
						</SubmitButton>
					</div>
				</form>
			</Modal>

			<ConfirmModal
				isOpen={!!tenantToDelete}
				onClose={() => setTenantToDelete(null)}
				onConfirm={handleDeleteTenant}
				title="Supprimer définitivement ?"
				message={`ATTENTION : La suppression de "${tenantToDelete?.name}" est IRRÉVERSIBLE et effacera toutes les données de ce client. Préférez la désactivation de l&apos;accès si le client n&apos;a simplement pas payé.`}
				confirmLabel="Supprimer"
				isLoading={isPending}
			/>
		</div>
	);
}
