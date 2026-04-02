"use client";

import { useState, useTransition } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/FormInput";
import { User, UserRole } from "@/types/schema";
import { UserPlus, Mail, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/format";
import { createUserAction, updateUserAction, deleteUserAction } from "@/actions/users.actions";
import { useRouter } from "@/i18n/routing";

interface StaffClientViewProps {
  initialStaff: User[];
}

export default function StaffClientView({ initialStaff = [] }: StaffClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const router = useRouter();

  const handleAction = (u: User) => {
    setSelectedStaff(u);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    
    startTransition(async () => {
      const result = await deleteUserAction({ id });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as UserRole,
      password: (formData.get("password") as string) || "Default123!", // En prod, générer ou demander
    };

    startTransition(async () => {
      let result;
      if (selectedStaff) {
        result = await updateUserAction({ id: selectedStaff.id, ...data });
      } else {
        result = await createUserAction(data);
      }

      if (result.success) {
        setIsModalOpen(false);
        setSelectedStaff(null);
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const columns = [
    {
      header: t("full_name"),
      accessor: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-teal/10 flex items-center justify-center text-primary-teal font-bold">
            {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
          </div>
          <span className="font-medium text-gray-900">{formatFullName(u.firstName, u.lastName)}</span>
        </div>
      ),
    },
    {
      header: t("email"),
      accessor: (u: User) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail size={16} className="text-gray-400" />
          <span>{u.email}</span>
        </div>
      ),
    },
    {
      header: t("role_header"),
      accessor: (u: User) => {
        const roleLabel = u.role === UserRole.GERANT ? t("manager") : u.role === UserRole.SECRETAIRE ? t("secretary") : t("teacher");
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <ShieldCheck size={12} />
            {roleLabel}
          </span>
        );
      },
    },
    {
      header: t("status_header"),
      accessor: (u: User) => (
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {u.isActive ? t("active") : t("inactive")}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("staff_title")}</h1>
          <p className="text-sm text-gray-500">{t("staff_subtitle")}</p>
        </div>
        <button 
          onClick={() => {
            setSelectedStaff(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-accent-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-teal/90 transition-colors"
        >
          <UserPlus size={20} />
          {t("add_member")}
        </button>
      </div>

      <DataTable
        data={initialStaff}
        columns={columns}
        searchPlaceholder={t("search_staff_placeholder")}
        onAction={handleAction}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        title={selectedStaff ? t("edit_member") : t("add_staff_title")}
        footer={
          <>
            <button disabled={isPending} onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">{t("cancel")}</button>
            <button 
              form="staff-form"
              type="submit"
              disabled={isPending} 
              className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {selectedStaff ? t("save_changes") : t("add")}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="firstName" label={t("first_name")} defaultValue={selectedStaff?.firstName} placeholder="Ex: Karim" required />
          <Input name="lastName" label={t("last_name")} defaultValue={selectedStaff?.lastName} placeholder="Ex: Zidane" required />
          <div className="sm:col-span-2">
            <Input name="email" label={t("email")} defaultValue={selectedStaff?.email} placeholder="Ex: karim@taysir.dz" type="email" required />
          </div>
          <Select 
            name="role"
            label={t("role_header")} 
            defaultValue={selectedStaff?.role}
            options={[
              { label: t("manager"), value: UserRole.GERANT },
              { label: t("secretary"), value: UserRole.SECRETAIRE },
              { label: t("teacher"), value: UserRole.INTERVENANT },
            ]} 
          />
          {!selectedStaff && (
            <div className="sm:col-span-2">
              <Input name="password" label={t("password")} type="password" placeholder="••••••••" required />
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
