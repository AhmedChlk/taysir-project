"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/FormInput";
import { Toggle } from "@/components/ui/Toggle";
import { User as StaffMember, UserRole } from "@/types/schema";
import { UserPlus, Mail, ShieldCheck, Trash2, Loader2, Key, Filter, CheckCircle2, XCircle, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/format";
import { createUserAction, updateUserAction, deleteUserAction, resetUserPasswordAction } from "@/actions/users.actions";
import { useRouter } from "@/i18n/routing";

interface StaffClientViewProps {
  initialStaff: StaffMember[];
}

export default function StaffClientView({ initialStaff = [] }: StaffClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const router = useRouter();

  const handleAction = (u: StaffMember) => {
    setSelectedStaff(u);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: StaffMember) => {
    startTransition(async () => {
      const result = await updateUserAction({ 
        id: user.id, 
        status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' 
      });
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleResetPassword = async () => {
    if (!selectedStaff || newPassword.length < 8) return;
    
    startTransition(async () => {
      const result = await resetUserPasswordAction({ 
        id: selectedStaff.id, 
        newPassword 
      });
      if (result.success) {
        setIsResetModalOpen(false);
        setNewPassword("");
        alert(t("save_success"));
      } else {
        alert(result.error.message);
      }
    });
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
      accessor: (u: StaffMember) => (
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
      accessor: (u: StaffMember) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail size={16} className="text-gray-400" />
          <span>{u.email}</span>
        </div>
      ),
    },
    {
      header: t("role_header"),
      accessor: (u: StaffMember) => {
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
      accessor: (u: StaffMember) => (
        <div className="flex items-center gap-3">
          <Toggle 
            enabled={u.status === 'ACTIVE'} 
            onChange={() => handleToggleStatus(u)} 
          />
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            u.status === 'ACTIVE' ? "bg-green-100 text-green-700" : u.status === 'ON_LEAVE' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          }`}>
            {u.status === 'ACTIVE' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {u.status === 'ACTIVE' ? t("active") : u.status === 'ON_LEAVE' ? t("on_leave") : t("inactive")}
          </span>
        </div>
      ),
    },
    {
      header: t("actions"),
      accessor: (u: StaffMember) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setSelectedStaff(u);
              setIsResetModalOpen(true);
            }}
            className="p-2 text-gray-400 hover:text-primary-teal hover:bg-primary-teal/5 rounded-lg transition-all"
            title={t("reset_password")}
          >
            <Key size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title={t("delete")}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const filteredStaff = initialStaff.filter(u => 
    roleFilter === "ALL" || u.role === roleFilter
  );

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
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <UserPlus size={20} />
          {t("add_member")}
        </button>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t("total_staff")}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{initialStaff.length}</span>
            <span className="text-xs text-gray-400">{t("members")}</span>
          </div>
        </div>
        
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t("active")}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{initialStaff.filter(s => s.status === 'ACTIVE').length}</span>
            <span className="text-xs text-green-600 font-medium">{t("online")}</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t("teachers")}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{initialStaff.filter(s => s.role === UserRole.INTERVENANT).length}</span>
            <span className="text-xs text-blue-600 font-medium">{t("teachers")}</span>
          </div>
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRoleFilter("ALL")}
          className={clsx(
            "flex items-center gap-2 text-sm border",
            roleFilter === "ALL" ? "btn-primary border-taysir-teal" : "btn-ghost border-transparent hover:border-taysir-teal/20"
          )}
        >
          <Filter size={16} />
          {t("all_roles")}
        </button>
        {[UserRole.GERANT, UserRole.SECRETAIRE, UserRole.INTERVENANT].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={clsx(
              "text-sm border",
              roleFilter === role ? "btn-primary border-taysir-teal" : "btn-ghost border-transparent hover:border-taysir-teal/20"
            )}
          >
            {role === UserRole.GERANT ? t("manager") : role === UserRole.SECRETAIRE ? t("secretary") : t("teacher")}
          </button>
        ))}
      </div>

      <DataTable
        data={filteredStaff}
        columns={columns}
        searchPlaceholder={t("search_staff_placeholder")}
        onAction={handleAction}
      />

      {/* Password Reset Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={t("reset_password")}
        footer={
          <>
            <button disabled={isPending} onClick={() => setIsResetModalOpen(false)} className="btn-ghost text-sm">{t("cancel")}</button>
            <button 
              onClick={handleResetPassword}
              disabled={isPending || newPassword.length < 8} 
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {t("change_password")}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {t("reset_password_desc", { name: formatFullName(selectedStaff?.firstName, selectedStaff?.lastName) })}
          </p>
          <Input 
            label={t("new_password")} 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder={t("min_8_chars_placeholder")}
            required 
          />
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        title={selectedStaff ? t("edit_member") : t("add_staff_title")}
        footer={
          <>
            <button disabled={isPending} onClick={() => setIsModalOpen(false)} className="btn-ghost text-sm">{t("cancel")}</button>
            <button 
              form="staff-form"
              type="submit"
              disabled={isPending} 
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {selectedStaff ? t("save_changes") : t("add")}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="firstName" label={t("first_name")} defaultValue={selectedStaff?.firstName} placeholder={t("placeholder_first_name")} required />
          <Input name="lastName" label={t("last_name")} defaultValue={selectedStaff?.lastName} placeholder={t("placeholder_last_name")} required />
          <div className="sm:col-span-2">
            <Input name="email" label={t("email")} defaultValue={selectedStaff?.email} placeholder={t("placeholder_email")} type="email" required />
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
