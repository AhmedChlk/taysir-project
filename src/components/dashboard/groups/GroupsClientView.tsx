"use client";

import { useState, useMemo, useTransition } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/FormInput";
import { Group, UserRole, Activity, User as UserType, Student } from "@/types/schema";
import { Plus, Users, BookOpen, User, Trash2, Loader2, UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatFullName } from "@/utils/format";
import { createGroupAction, updateGroupAction, deleteGroupAction } from "@/actions/logistics.actions";
import { removeStudentFromGroupAction } from "@/actions/students.actions";
import { useRouter } from "@/i18n/routing";

interface GroupsClientViewProps {
  initialGroups: Group[];
  activities: Activity[];
  staff: UserType[];
}

export default function GroupsClientView({ initialGroups = [], activities = [], staff = [] }: GroupsClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const router = useRouter();

  const activitiesMap = useMemo(() => {
    return (activities || []).reduce((acc, a) => {
      acc[a.id] = a;
      return acc;
    }, {} as Record<string, Activity>);
  }, [activities]);

  const staffMap = useMemo(() => {
    return (staff || []).reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, UserType>);
  }, [staff]);

  const handleAction = (group: Group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    startTransition(async () => {
      const result = await deleteGroupAction({ id });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const handleRemoveStudent = async (studentId: string, groupId: string) => {
    if (!confirm("Voulez-vous retirer cet étudiant du groupe ?")) return;
    startTransition(async () => {
      const result = await removeStudentFromGroupAction({ studentId, groupId });
      if (result.success) {
        router.refresh();
        // Mise à jour locale pour éviter de fermer la modale si on veut en enlever plusieurs
        if (selectedGroup) {
          setSelectedGroup({
            ...selectedGroup,
            students: selectedGroup.students?.filter(s => s.id !== studentId)
          });
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      activityId: formData.get("activityId") as string,
      instructorId: formData.get("instructorId") as string,
    };

    startTransition(async () => {
      let result;
      if (selectedGroup) {
        result = await updateGroupAction({ id: selectedGroup.id, ...data });
      } else {
        result = await createGroupAction(data);
      }

      if (result.success) {
        setIsModalOpen(false);
        setSelectedGroup(null);
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const columns = [
    {
      header: t("group_name"),
      accessor: (group: Group) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-teal/10 text-accent-teal">
            <Users size={20} />
          </div>
          <span className="font-medium text-gray-900">{group.name}</span>
        </div>
      ),
    },
    {
      header: t("activities"),
      accessor: (group: Group) => {
        const activity = activitiesMap[group.activityId];
        return (
          <div className="flex items-center gap-2 text-gray-600">
            < BookOpen size={16} className="text-gray-400" />
            <span>{activity?.name || t("unknown")}</span>
          </div>
        );
      },
    },
    {
      header: t("teacher"),
      accessor: (group: Group) => {
        const instructor = staffMap[group.instructorId];
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <User size={16} className="text-gray-400" />
            <span>{formatFullName(instructor?.firstName, instructor?.lastName) || t("unknown")}</span>
          </div>
        );
      },
    },
    {
      header: t("registrations"),
      accessor: (group: Group) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          {t("participants_count", { count: group.students?.length || 0 })}
        </span>
      ),
    },
    {
      header: t("status_header"),
      accessor: (group: Group) => (
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            group.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {group.isActive ? t("active") : t("inactive")}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
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
          <h1 className="text-2xl font-bold text-gray-900">{t("groups_title")}</h1>
          <p className="text-sm text-gray-500">{t("groups_subtitle")}</p>
        </div>
        <button 
          onClick={() => {
            setSelectedGroup(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-accent-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-teal/90 transition-colors"
        >
          <Plus size={20} />
          {t("add_group")}
        </button>
      </div>

      <DataTable
        data={initialGroups}
        columns={columns}
        searchPlaceholder={t("search")}
        onAction={handleAction}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGroup(null);
        }}
        title={selectedGroup ? t("edit_group") : t("add_group")}
        footer={
          <>
            <button disabled={isPending} onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">{t("cancel")}</button>
            <button 
              form="group-form"
              type="submit"
              disabled={isPending} 
              className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {selectedGroup ? t("save_changes") : t("add")}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <form id="group-form" onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" label={t("group_name")} defaultValue={selectedGroup?.name} placeholder="Ex: Alpha - Avancé" required />
            <Select 
              name="activityId"
              label={t("activity_associated")} 
              defaultValue={selectedGroup?.activityId}
              options={activities.map(a => ({ label: a.name, value: a.id }))} 
              required
            />
            <Select 
              name="instructorId"
              label={t("instructor_main")} 
              defaultValue={selectedGroup?.instructorId}
              options={(staff || []).filter(u => u.role === UserRole.INTERVENANT).map(i => ({ label: formatFullName(i.firstName, i.lastName), value: i.id }))} 
              required
            />
          </form>

          {selectedGroup && selectedGroup.students && selectedGroup.students.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={16} className="text-primary-teal" />
                Liste des élèves dans ce groupe
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {selectedGroup.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-700">{student.firstName} {student.lastName}</span>
                      <span className="text-xs text-gray-500">{student.email || student.phone || "Sans contact"}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveStudent(student.id, selectedGroup.id)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Retirer du groupe"
                    >
                      <UserMinus size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
