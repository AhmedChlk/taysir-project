"use client";

import { useState, useMemo, useTransition } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/FormInput";
import { Group, Activity, User as UserType, Student } from "@/types/schema";
import { Plus, Users, Trash2, Loader2, UserMinus, Search, Inbox, CheckCircle2, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { createGroupAction, updateGroupAction, deleteGroupAction } from "@/actions/logistics.actions";
import { removeStudentFromGroupAction, addStudentToGroupAction } from "@/actions/students.actions";
import { useRouter } from "@/i18n/routing";
import { clsx } from "clsx";

interface GroupsClientViewProps {
  initialGroups: Group[];
  activities: Activity[];
  staff: UserType[];
  students: Student[];
}

export default function GroupsClientView({ initialGroups = [], activities = [], staff = [], students = [] }: GroupsClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>("");
  const t = useTranslations();
  const router = useRouter();

  // Metrics calculation for the Bento Grid
  const metrics = useMemo(() => {
    const totalGroups = initialGroups.length;
    const activeGroups = initialGroups.filter(g => g.isActive).length;
    const totalStudentsInGroups = initialGroups.reduce((acc, g) => acc + (g.students?.length || 0), 0);
    const avgStudents = totalGroups > 0 ? Math.round(totalStudentsInGroups / totalGroups) : 0;
    
    return { totalGroups, activeGroups, totalStudentsInGroups, avgStudents };
  }, [initialGroups]);

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
        if (selectedGroup) {
          setSelectedGroup({
            ...selectedGroup,
            students: selectedGroup.students?.filter(s => s.id !== studentId)
          });
        }
      }
    });
  };

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd || !selectedGroup) return;
    
    startTransition(async () => {
      const result = await addStudentToGroupAction({ 
        studentId: selectedStudentToAdd, 
        groupId: selectedGroup.id 
      });
      
      if (result.success) {
        setSelectedStudentToAdd("");
        router.refresh();
        const studentObj = students.find(s => s.id === selectedStudentToAdd);
        if (selectedGroup && studentObj) {
          setSelectedGroup({
            ...selectedGroup,
            students: [...(selectedGroup.students || []), studentObj]
          });
        }
      } else {
        alert(result.error.message);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
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
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-teal/20 to-primary-teal/10 text-primary-teal shadow-sm">
            <Users size={22} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-sm">{group.name}</span>
            <span className="text-xs text-gray-500 font-medium">Id: {group.id.split('-')[0]}</span>
          </div>
        </div>
      ),
    },
    {
      header: t("registrations"),
      accessor: (group: Group) => (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {(group.students || []).slice(0, 3).map((_, i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                <UserTypeIcon />
              </div>
            ))}
            {(group.students?.length || 0) > 3 && (
              <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                +{(group.students?.length || 0) - 3}
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-700 ml-2">
            {group.students?.length || 0} {t("students")?.toLowerCase() || "élèves"}
          </span>
        </div>
      ),
    },
    {
      header: t("status_header"),
      accessor: (group: Group) => (
        <span className={clsx(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm transition-all",
          group.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        )}>
          <span className={clsx("h-1.5 w-1.5 rounded-full", group.isActive ? "bg-green-500" : "bg-red-500")} />
          {group.isActive ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (group: Group) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-red-500/20"
            title="Supprimer ce groupe"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ease-out">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t("groups_title")}</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{t("groups_subtitle")}</p>
        </div>
        <button 
          onClick={() => {
            setSelectedGroup(null);
            setIsModalOpen(true);
            if (navigator.vibrate) navigator.vibrate(50);
          }}
          className="flex items-center gap-2 rounded-xl bg-primary-teal px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-teal/30 hover:bg-primary-teal/90 hover:-translate-y-0.5 transition-all duration-300 ease-out active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          {t("add_group")}
        </button>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-gray-600 text-sm">Total Groupes</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{metrics.totalGroups}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-semibold text-gray-600 text-sm">Groupes Actifs</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{metrics.activeGroups}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-semibold text-gray-600 text-sm">Élèves Inscrits</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{metrics.totalStudentsInGroups}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-gray-600 text-sm">Moy. Élèves/Groupe</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{metrics.avgStudents}</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          data={initialGroups}
          columns={columns}
          searchPlaceholder="Rechercher un groupe..."
          onAction={handleAction}
        />
      </div>

      {/* Modal Redesign */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGroup(null);
        }}
        title={selectedGroup ? "Gérer le groupe" : "Nouveau groupe"}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button 
              disabled={isPending} 
              onClick={() => setIsModalOpen(false)} 
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all duration-300"
            >
              {t("cancel")}
            </button>
            <button 
              form="group-form"
              type="submit"
              disabled={isPending} 
              className="flex items-center gap-2 rounded-xl bg-primary-teal px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-teal/90 hover:shadow-lg transition-all duration-300 active:scale-95"
            >
              {isPending && <Loader2 size={18} className="animate-spin" />}
              {selectedGroup ? t("save_changes") : t("add")}
            </button>
          </div>
        }
      >
        <div className="space-y-8 py-2">
          {/* Edit Form */}
          <form id="group-form" onSubmit={handleSubmit} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                1
              </div>
              Informations générales
            </h4>
            <Input 
              name="name" 
              label="Nom du groupe" 
              defaultValue={selectedGroup?.name} 
              placeholder="Ex: Groupe A - Mathématiques" 
              required 
            />
          </form>

          {/* Students Management Section (Only visible if Editing) */}
          {selectedGroup && (
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                  2
                </div>
                Gestion des élèves
              </h4>
              
              {/* Add Student Row */}
              <div className="flex gap-3 items-end bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex-1">
                  <Select
                    label="Ajouter un nouvel élève"
                    value={selectedStudentToAdd}
                    onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                    options={[
                      { label: "Sélectionner un élève...", value: "" },
                      ...students
                        .filter(s => !selectedGroup.students?.some(gs => gs.id === s.id))
                        .map(s => ({ label: `${s.firstName} ${s.lastName} ${s.email ? `(${s.email})` : ''}`, value: s.id }))
                    ]}
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (navigator.vibrate) navigator.vibrate(50);
                    handleAddStudent();
                  }}
                  disabled={isPending || !selectedStudentToAdd}
                  className="mb-1.5 flex items-center gap-2 px-5 py-2.5 bg-accent-teal text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-accent-teal/90 shadow-sm transition-all active:scale-95"
                >
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>

              {/* Student List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Élèves inscrits ({selectedGroup.students?.length || 0})
                  </span>
                </div>

                {!selectedGroup.students || selectedGroup.students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Inbox size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700 mb-1">Aucun élève</h3>
                    <p className="text-xs text-gray-500 text-center max-w-[250px]">
                      Ce groupe est vide. Ajoutez des élèves en utilisant le sélecteur ci-dessus.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedGroup.students.map((student) => (
                      <div 
                        key={student.id} 
                        className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm shadow-inner">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-primary-teal transition-colors">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-xs font-medium text-gray-500">
                              {student.email || student.phone || "Aucun contact"}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveStudent(student.id, selectedGroup.id);
                          }}
                          disabled={isPending}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                          title="Retirer du groupe"
                        >
                          <UserMinus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// Icon helper for the table
function UserTypeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
