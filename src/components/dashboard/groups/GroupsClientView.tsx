"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Group, Activity, User } from "@/types/schema";
import { createGroupAction, updateGroupAction, deleteGroupAction } from "@/actions/logistics.actions";
import Modal from "@/components/ui/Modal";
import { Input, Select, TextArea } from "@/components/ui/FormInput";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";

interface GroupsClientViewProps {
  initialGroups: Group[];
  activities: Activity[];
  staff: User[];
}

export default function GroupsClientView({ initialGroups, activities, staff }: GroupsClientViewProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Préparation des options pour les menus déroulants
  const activityOptions = activities.map(a => ({ label: a.name, value: a.id }));
  const staffOptions = staff.map(s => ({ 
    label: `${s.firstName} ${s.lastName}`, 
    value: s.id 
  }));

  const filteredGroups = initialGroups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (formData: FormData) => {
    const data = {
      id: selectedGroup?.id,
      name: formData.get("name"),
      level: formData.get("level"),
      activityId: formData.get("activityId"),
      instructorId: formData.get("instructorId"),
      capacity: formData.get("capacity"),
      schedule: formData.get("schedule"),
    };

    startTransition(async () => {
      const result = selectedGroup 
        ? await updateGroupAction(data)
        : await createGroupAction(data);

      if (result.success) {
        setIsModalOpen(false);
        setSelectedGroup(null);
        router.refresh();
      } else {
        alert("Erreur: " + result.error.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("groups_title")}</h1>
          <p className="text-gray-500">{t("groups_subtitle")}</p>
        </div>
        <button 
          onClick={() => { setSelectedGroup(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2 text-white hover:bg-primary-teal/90"
        >
          <Plus size={20} /> {t("add")}
        </button>
      </div>

      {/* Filtres */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder={t("search")}
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-primary-teal focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredGroups.length > 0 ? (
        <DataTable 
          data={filteredGroups}
          columns={[
            { header: t("name"), accessor: "name" },
            { header: t("level"), accessor: "level" },
            { header: t("capacity"), accessor: "capacity" },
          ]}
          onEdit={(group) => { setSelectedGroup(group); setIsModalOpen(true); }}
          onDelete={(group) => deleteGroupAction({ id: group.id }).then(() => router.refresh())}
        />
      ) : (
        <EmptyState icon={Users} title={t("no_results")} description={t("empty_list_desc")} />
      )}

      {/* MODAL DE CRÉATION / ÉDITION */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGroup ? t("edit") : t("add")}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">{t("cancel")}</button>
            <button type="submit" form="group-form" disabled={isPending} className="rounded-lg bg-primary-teal px-4 py-2 text-white">
              {isPending ? "..." : t("save")}
            </button>
          </div>
        }
      >
        <form id="group-form" action={handleSubmit} className="space-y-4">
          <Input name="name" label={t("name")} defaultValue={selectedGroup?.name} required />
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              name="activityId" 
              label={t("activity")} 
              options={activityOptions} 
              defaultValue={selectedGroup?.activityId}
            />
            <Select 
              name="instructorId" 
              label={t("instructor")} 
              options={staffOptions} 
              defaultValue={selectedGroup?.instructorId}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input name="level" label={t("level")} defaultValue={selectedGroup?.level} />
            <Input name="capacity" label={t("capacity")} type="number" defaultValue={selectedGroup?.capacity} />
          </div>

          <Input name="schedule" label={t("schedule")} placeholder="Ex: Lun, Mer 14:00" defaultValue={selectedGroup?.schedule} />
        </form>
      </Modal>
    </div>
  );
}