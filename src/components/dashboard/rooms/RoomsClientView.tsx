"use client";

import { useState, useTransition } from "react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { Input, TextArea } from "@/components/ui/FormInput";
import { Room } from "@/types/schema";
import { Plus, MapPin, Users, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createRoomAction, updateRoomAction, deleteRoomAction } from "@/actions/logistics.actions";
import { useRouter } from "@/i18n/routing";

interface RoomsClientViewProps {
  initialRooms: Room[];
}

export default function RoomsClientView({ initialRooms = [] }: RoomsClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const router = useRouter();

  const handleAction = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    startTransition(async () => {
      const result = await deleteRoomAction({ id });
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
      name: formData.get("name") as string,
      capacity: parseInt(formData.get("capacity") as string, 10),
      description: formData.get("description") as string,
    };

    startTransition(async () => {
      let result;
      if (selectedRoom) {
        result = await updateRoomAction({ id: selectedRoom.id, ...data });
      } else {
        result = await createRoomAction(data);
      }

      if (result.success) {
        setIsModalOpen(false);
        setSelectedRoom(null);
        router.refresh();
      } else {
        alert(result.error.message);
      }
    });
  };

  const columns = [
    {
      header: t("room_name"),
      accessor: (room: Room) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-teal/10 text-primary-teal">
            <MapPin size={20} />
          </div>
          <span className="font-medium text-gray-900">{room.name}</span>
        </div>
      ),
    },
    {
      header: t("capacity"),
      accessor: (room: Room) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={16} className="text-gray-400" />
          <span>{t("capacity_places", { count: room.capacity })}</span>
        </div>
      ),
    },
    {
      header: t("description"),
      accessor: (room: Room) => (
        <div className="flex items-center justify-between gap-4">
          <span className="max-w-xs truncate text-gray-500">{room.description || "-"}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("rooms_title")}</h1>
          <p className="text-sm text-gray-500">{t("rooms_subtitle")}</p>
        </div>
        <button 
          onClick={() => {
            setSelectedRoom(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-accent-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-teal/90 transition-colors"
        >
          <Plus size={20} />
          {t("add_room")}
        </button>
      </div>

      {/* Rooms Table */}
      <DataTable
        data={initialRooms}
        columns={columns}
        searchPlaceholder={t("search")}
        onAction={handleAction}
      />

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoom(null);
        }}
        title={selectedRoom ? t("edit_room") : t("add_room")}
        footer={
          <>
            <button disabled={isPending} onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">{t("cancel")}</button>
            <button 
              form="room-form"
              type="submit"
              disabled={isPending} 
              className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-teal/90 transition-colors"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {selectedRoom ? t("save_changes") : t("add")}
            </button>
          </>
        }
      >
        <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" label={t("room_name")} defaultValue={selectedRoom?.name ?? undefined} placeholder="Ex: Salle A1" required />
          <Input name="capacity" label={t("capacity")} type="number" defaultValue={selectedRoom?.capacity ?? undefined} placeholder="Ex: 20" required />
          <TextArea name="description" label={t("description")} defaultValue={selectedRoom?.description ?? undefined} placeholder={t("description_placeholder")} />
        </form>
      </Modal>
    </div>
  );
}
