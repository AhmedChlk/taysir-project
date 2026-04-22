"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Building2, Globe, Palette, Users, GraduationCap, ShieldAlert, CheckCircle2, XCircle, Calendar, Edit3 } from "lucide-react";
import { createTenantAction, deleteTenantAction, toggleTenantStatusAction, updateTenantAction } from "@/actions/superadmin.actions";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/FormInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { clsx } from "clsx";
import { formatDate } from "@/utils/format";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

interface Tenant {
	id: string;
	name: string;
	slug: string;
    isActive: boolean;
	primaryColor: string | null;
    contractEndDate: Date | null;
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
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
	const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
    const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
    const locale = useLocale();

    // Auto-slug generation
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]/g, "-") // replace non-alphanumeric with -
            .replace(/-+/g, "-") // remove double -
            .replace(/^-|-$/g, ""); // trim -
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormName(val);
        setFormSlug(generateSlug(val));
    };

	const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
        setError(null);
		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name") as string,
			slug: formData.get("slug") as string,
			primaryColor: formData.get("primaryColor") as string,
            contractEndDate: formData.get("contractEndDate") as string,
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

    const handleUpdateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedTenant) return;
        setError(null);
        const formData = new FormData(e.currentTarget);
        const data = {
            id: selectedTenant.id,
            name: formData.get("name") as string,
            slug: formData.get("slug") as string,
            primaryColor: formData.get("primaryColor") as string,
            contractEndDate: formData.get("contractEndDate") as string,
        };

        startTransition(async () => {
            const res = await updateTenantAction(data);
            if (res.success) {
                setTenants(tenants.map(t => t.id === selectedTenant.id ? { ...t, ...res.data, contractEndDate: res.data.contractEndDate ? new Date(res.data.contractEndDate) : null } : t));
                setSelectedTenant(null);
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
		<div className="space-y-10 pb-20">
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-1">
					<div className="t-eyebrow">Administration Globale</div>
					<h1 className="text-4xl font-bold text-ink-900 tracking-tight">
						Parc <span className="text-brand-500">Établissements</span>
					</h1>
					<p className="text-ink-500 font-medium max-w-lg leading-relaxed">
						Gérez l'ensemble des instances déployées, les contrats et les accès privilégiés de vos clients.
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
                        setError(null);
                        setIsCreateModalOpen(true);
                    }}
					className="btn btn--primary btn--lg shadow-xl shadow-brand-500/10 self-start md:self-end"
				>
					<Plus size={20} />
					Nouveau Client
				</button>
			</div>

            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-danger text-sm font-semibold flex items-center gap-3 shadow-sm"
                    >
                        <ShieldAlert size={20} className="shrink-0" />
                        <p className="flex-1 leading-snug">{error}</p>
                        <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-lg transition-colors">
                            <XCircle size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{tenants.map((tenant) => (
					<motion.div
						key={tenant.id}
                        layout
						className={clsx(
                            "group bg-white rounded-[24px] border transition-all duration-300 relative overflow-hidden flex flex-col",
                            tenant.isActive 
                                ? "border-line shadow-sm hover:shadow-xl hover:shadow-brand-900/5 hover:-translate-y-1" 
                                : "border-rose-100 bg-rose-50/10 grayscale-[0.5]"
                        )}
					>
						{/* Active Indicator */}
						<div
							className={clsx(
                                "absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300",
                                tenant.isActive ? "bg-brand-500" : "bg-danger"
                            )}
						/>

						<div className="p-8 flex flex-col flex-1">
                            <div className="flex items-start justify-between mb-8">
                                <div className={clsx(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center border shadow-sm transition-colors",
                                    tenant.isActive ? "bg-surface-50 text-brand-500 border-line" : "bg-rose-50 text-danger border-rose-100"
                                )}>
                                    <Building2 size={28} strokeWidth={1.75} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTenant(tenant)}
                                        className="p-2.5 text-ink-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                                        title="Modifier"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStatus(tenant)}
                                        className={clsx(
                                            "p-2.5 rounded-xl transition-all",
                                            tenant.isActive 
                                                ? "text-ink-400 hover:text-danger hover:bg-rose-50" 
                                                : "text-danger hover:text-success hover:bg-emerald-50"
                                        )}
                                        title={tenant.isActive ? "Désactiver" : "Activer"}
                                    >
                                        {tenant.isActive ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTenantToDelete(tenant)}
                                        className="p-2.5 text-ink-400 hover:text-danger hover:bg-rose-50 rounded-xl transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-2xl font-bold text-ink-900 line-clamp-1 tracking-tight">{tenant.name}</h3>
                                    {!tenant.isActive && (
                                        <span className="text-[10px] font-bold text-danger bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Suspendu</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-ink-400 text-xs font-semibold uppercase tracking-widest">
                                    <Globe size={14} />
                                    {tenant.slug}.taysir.dz
                                </div>
                            </div>

                            <div className="mb-8 p-5 bg-surface-50 rounded-2xl border border-line">
                                <div className="flex items-center gap-2 text-ink-400 mb-2">
                                    <Calendar size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Échéance contrat</span>
                                </div>
                                <span className={clsx(
                                    "text-sm font-bold tracking-tight",
                                    tenant.contractEndDate && new Date(tenant.contractEndDate) < new Date() ? "text-danger" : "text-ink-700"
                                )}>
                                    {tenant.contractEndDate ? formatDate(tenant.contractEndDate, locale) : "Contrat illimité"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-auto">
                                <div className="bg-white rounded-2xl p-4 border border-line shadow-sm">
                                    <div className="flex items-center gap-2 text-ink-400 mb-1">
                                        <Users size={16} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Staff</span>
                                    </div>
                                    <span className="text-xl font-bold text-ink-900 tabular-nums">{tenant._count.users}</span>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border border-line shadow-sm">
                                    <div className="flex items-center gap-2 text-ink-400 mb-1">
                                        <GraduationCap size={16} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Élèves</span>
                                    </div>
                                    <span className="text-xl font-bold text-ink-900 tabular-nums">{tenant._count.students}</span>
                                </div>
                            </div>
                        </div>
					</motion.div>
				))}
			</div>

			{/* Modal Création */}
			<Modal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				title="Déploiement d'une nouvelle instance"
			>
				<form onSubmit={handleCreateTenant} className="space-y-8 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar pb-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-brand-500 font-bold text-xs uppercase tracking-widest mb-4 border-b border-line pb-4">
                            <Building2 size={16} />
                            Information Client
                        </div>
                        <div className="space-y-4">
                            <Input
                                label="Nom de l'école / entreprise"
                                name="name"
                                placeholder="ex: École les Glycines"
                                required
                                value={formName}
                                onChange={handleNameChange}
                            />
                            <div className="space-y-1">
                                <Input
                                    label="Slug (Identifiant URL unique)"
                                    name="slug"
                                    placeholder="ex: glycines"
                                    required
                                    value={formSlug}
                                    onChange={(e) => setFormSlug(generateSlug(e.target.value))}
                                />
                                <p className="text-[10px] text-ink-400 font-medium px-1">
                                    Cet identifiant servira à créer l'adresse d'accès : <span className="text-brand-500 font-bold">{formSlug || "votre-ecole"}.taysir.dz</span>
                                </p>
                            </div>
                            <Input
                                label="Date de fin de contrat"
                                name="contractEndDate"
                                type="date"
                            />
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-ink-700 uppercase tracking-wide flex items-center gap-2">
                                    <Palette size={16} className="text-brand-500" />
                                    Identité Visuelle
                                </label>
                                <div className="flex items-center gap-6 p-4 bg-surface-50 rounded-xl border border-line">
                                    <input
                                        type="color"
                                        name="primaryColor"
                                        defaultValue="#1A7A89"
                                        className="h-10 w-20 rounded-lg cursor-pointer border-2 border-white shadow-sm p-0.5"
                                    />
                                    <span className="text-xs font-medium text-ink-500 leading-relaxed">Cette couleur sera utilisée comme accent principal sur le dashboard du client.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-brand-900 font-bold text-xs uppercase tracking-widest mb-4 border-b border-line pb-4 pt-4">
                            <ShieldAlert size={16} />
                            Compte Gérant Initial
                        </div>
                        <div className="space-y-4">
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
                            <div className="p-4 bg-brand-50 border border-brand-500/20 rounded-xl">
                                <p className="text-xs font-semibold text-brand-900 leading-relaxed">
                                    Ce compte aura les pleins pouvoirs (GERANT) sur l'instance créée. Communiquez ces identifiants au client après le déploiement.
                                </p>
                            </div>
                        </div>
                    </div>

					<div className="flex justify-end gap-3 pt-8 sticky bottom-0 bg-white">
						<button
							type="button"
							onClick={() => setIsCreateModalOpen(false)}
							className="btn btn--ghost btn--md"
						>
							Annuler
						</button>
						<SubmitButton isLoading={isPending} className="btn btn--primary btn--md px-8">
							Lancer le déploiement
						</SubmitButton>
					</div>
				</form>
			</Modal>

            {/* Modal Modification */}
            <Modal
                isOpen={!!selectedTenant}
                onClose={() => setSelectedTenant(null)}
                title={`Modifier ${selectedTenant?.name}`}
            >
                <form onSubmit={handleUpdateTenant} className="space-y-6 pb-6">
                    <Input
                        label="Nom de l'établissement"
                        name="name"
                        defaultValue={selectedTenant?.name}
                        required
                    />
                    <Input
                        label="Slug"
                        name="slug"
                        defaultValue={selectedTenant?.slug}
                        required
                    />
                    <Input
                        label="Date de fin de contrat"
                        name="contractEndDate"
                        type="date"
                        defaultValue={selectedTenant?.contractEndDate ? new Date(selectedTenant.contractEndDate).toISOString().split('T')[0] : ''}
                    />
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-ink-700 uppercase tracking-wide flex items-center gap-2">
                            <Palette size={16} className="text-brand-500" />
                            Couleur Thème
                        </label>
                        <input
                            type="color"
                            name="primaryColor"
                            defaultValue={selectedTenant?.primaryColor || "#1A7A89"}
                            className="h-12 w-full rounded-xl cursor-pointer border-2 border-line p-1 bg-surface-50"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-8">
                        <button
                            type="button"
                            onClick={() => setSelectedTenant(null)}
                            className="btn btn--ghost btn--md"
                        >
                            Annuler
                        </button>
                        <SubmitButton isLoading={isPending} className="btn btn--primary btn--md px-8">
                            Enregistrer les modifications
                        </SubmitButton>
                    </div>
                </form>
            </Modal>

			<ConfirmModal
				isOpen={!!tenantToDelete}
				onClose={() => setTenantToDelete(null)}
				onConfirm={handleDeleteTenant}
				title="Supprimer définitivement ?"
				message={`ATTENTION : La suppression de "${tenantToDelete?.name}" est IRRÉVERSIBLE et effacera toutes les données de ce client. Préférez la désactivation de l'accès si le client n'a simplement pas payé.`}
				confirmLabel="Supprimer"
				isLoading={isPending}
			/>
		</div>
	);
}
