"use client";

import { useState, useTransition } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { Input, Select, Toggle } from "@/components/ui/FormInput";
import { Student, Group } from "@/types/schema";
import { Plus, User, Mail, Phone, Trash2, Loader2, Baby } from "lucide-react";
import { useTranslations } from "next-intl";
import { createStudentAction, updateStudentAction, deleteStudentAction } from "@/actions/students.actions";
import { useRouter } from "@/i18n/routing";

interface StudentsClientViewProps {
  initialStudents: Student[];
  groups: Group[];
}

export default function StudentsClientView({ initialStudents = [], groups = [] }: StudentsClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isMinor, setIsMinor] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const router = useRouter();

  const handleAction = (student: Student) => {
    setSelectedStudent(student);
    setIsMinor(student.isMinor || false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    startTransition(async () => {
      const result = await deleteStudentAction({ id });
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
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      isMinor: isMinor,
      parentName: formData.get("parentName") as string || null,
      parentPhone: formData.get("parentPhone") as string || null,
      parentEmail: formData.get("parentEmail") as string || null,
      groupId: formData.get("groupId") as string || null,
    };

    startTransition(async () => {
      let result;
      if (selectedStudent) {
        result = await updateStudentAction({ id: selectedStudent.id, ...data });
      } else {
        result = await createStudentAction(data);
      }

      if (result.success) {
        setIsModalOpen(false);
        setSelectedStudent(null);
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const columns = [
    {
      header: t("full_name"),
      accessor: (student: Student) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {student.isMinor ? <Baby size={20} /> : <User size={20} />}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{student.firstName} {student.lastName}</span>
            {student.isMinor && <span className="text-[10px] text-orange-600 font-bold uppercase">Mineur</span>}
          </div>
        </div>
      ),
    },
    {
      header: "Responsable / Parent",
      accessor: (student: Student) => (
        <div className="text-sm">
          {student.isMinor ? (
            <div className="flex flex-col">
              <span className="font-medium text-gray-700">{student.parentName || "-"}</span>
              <span className="text-xs text-gray-500">{student.parentPhone}</span>
            </div>
          ) : (
            <span className="text-gray-400">Auto-géré</span>
          )}
        </div>
      ),
    },
    {
      header: t("student_phone"),
      accessor: (student: Student) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone size={16} className="text-gray-400" />
          <span>{student.isMinor ? student.parentPhone : student.phone || "-"}</span>
        </div>
      ),
    },
    {
      header: t("status_header"),
      accessor: (student: Student) => (
        <div className="flex items-center justify-between gap-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            student.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {student.isActive ? t("active") : t("inactive")}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }}
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
          <h1 className="text-2xl font-bold text-gray-900">{t("students_title")}</h1>
          <p className="text-sm text-gray-500">{t("students_subtitle")}</p>
        </div>
        <button 
          onClick={() => {
            setSelectedStudent(null);
            setIsMinor(false);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors"
        >
          <Plus size={20} />
          {t("add_student")}
        </button>
      </div>

      <DataTable
        data={initialStudents}
        columns={columns}
        searchPlaceholder={t("search")}
        onAction={handleAction}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        title={selectedStudent ? t("edit_student") : t("add_student")}
        footer={
          <>
            <button disabled={isPending} onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">{t("cancel")}</button>
            <button 
              form="student-form"
              type="submit"
              disabled={isPending} 
              className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {selectedStudent ? t("save_changes") : t("add")}
            </button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <Baby size={20} className="text-primary-teal" />
              <span className="text-sm font-semibold text-gray-700">L'élève est-il mineur ?</span>
            </div>
            <Toggle checked={isMinor} onChange={setIsMinor} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input name="firstName" label={t("first_name")} defaultValue={selectedStudent?.firstName} required />
            <Input name="lastName" label={t("last_name")} defaultValue={selectedStudent?.lastName} required />
          </div>

          {!isMinor && (
            <>
              <Input name="email" type="email" label={t("student_email")} defaultValue={selectedStudent?.email || ""} />
              <Input name="phone" type="tel" label={t("student_phone")} defaultValue={selectedStudent?.phone || ""} />
            </>
          )}

          {isMinor && (
            <div className="space-y-4 p-4 bg-orange-50/30 rounded-xl border border-orange-100">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Informations du Parent / Tuteur</p>
              <Input name="parentName" label="Nom du parent" defaultValue={selectedStudent?.parentName || ""} required />
              <div className="grid grid-cols-2 gap-4">
                <Input name="parentPhone" label="Téléphone parent" defaultValue={selectedStudent?.parentPhone || ""} required />
                <Input name="parentEmail" label="Email parent" defaultValue={selectedStudent?.parentEmail || ""} />
              </div>
            </div>
          )}
          
          <Select 
            name="groupId"
            label={t("groups")} 
            defaultValue={selectedStudent?.groups?.[0]?.id || ""}
            options={[{ label: "Aucun groupe pour le moment", value: "" }, ...groups.map(g => ({ label: g.name, value: g.id }))]} 
          />
        </form>
      </Modal>
    </div>
  );
}
