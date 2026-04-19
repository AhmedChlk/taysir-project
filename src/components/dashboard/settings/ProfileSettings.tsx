"use client";

import { Loader2, Save, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import {
	deleteAccountAction,
	updateProfileAction,
} from "@/actions/settings.actions";
import { Input } from "@/components/ui/FormInput";

interface ProfileSettingsProps {
	user: any;
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
	const t = useTranslations();
	const [isPending, startTransition] = useTransition();

	const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const data = {
			firstName: formData.get("firstName") as string,
			lastName: formData.get("lastName") as string,
			email: formData.get("email") as string,
			phone: formData.get("phone") as string,
		};

		startTransition(async () => {
			const result = await updateProfileAction(data);
			if (result.success) {
				alert(t("save_success"));
			} else {
				alert(result.error.message);
			}
		});
	};

	const handleDeleteAccount = async () => {
		if (!confirm(t("delete_account_desc"))) return;

		startTransition(async () => {
			const result = await deleteAccountAction({});
			if (result.success) {
				signOut({ callbackUrl: "/login" });
			} else {
				alert(result.error.message);
			}
		});
	};

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			{/* Profile Card */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
				<form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-gray-100">
						<div className="h-20 w-20 rounded-full bg-primary-teal/10 flex items-center justify-center text-primary-teal text-2xl font-bold border-2 border-white shadow-sm ring-1 ring-gray-100">
							{user.firstName?.charAt(0)}
							{user.lastName?.charAt(0)}
						</div>
						<div className="space-y-2">
							<h3 className="text-sm font-semibold text-gray-900">
								{t("profile_photo")}
							</h3>
							<div className="flex gap-3">
								<button type="button" className="btn-secondary text-xs">
									{t("change_avatar")}
								</button>
								<button
									type="button"
									className="bg-red-600 text-white px-4 py-2 text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors"
								>
									{t("delete")}
								</button>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
						<Input
							name="firstName"
							label={t("first_name")}
							defaultValue={user.firstName}
							placeholder={t("placeholder_first_name")}
							required
						/>
						<Input
							name="lastName"
							label={t("last_name")}
							defaultValue={user.lastName}
							placeholder={t("placeholder_last_name")}
							required
						/>
						<Input
							name="email"
							label={t("email")}
							defaultValue={user.email}
							type="email"
							placeholder={t("placeholder_email")}
							required
						/>
						<Input
							name="phone"
							label={t("phone")}
							defaultValue={user.phone}
							placeholder={t("placeholder_phone")}
						/>
					</div>

					<div className="flex justify-end pt-4">
						<button
							type="submit"
							disabled={isPending}
							className="btn-primary flex items-center gap-2 disabled:opacity-50"
						>
							{isPending ? (
								<Loader2 size={18} className="animate-spin" />
							) : (
								<Save size={18} />
							)}
							{t("save")}
						</button>
					</div>
				</form>
			</div>

			{/* Danger Zone */}
			<div className="bg-red-50/50 border border-red-100 rounded-xl overflow-hidden">
				<div className="p-6 sm:p-8">
					<h3 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
						<Trash2 size={16} />
						{t("danger_zone")}
					</h3>
					<p className="text-sm text-red-700/80 mb-6 max-w-md">
						{t("delete_account_desc")}
					</p>
					<button
						onClick={handleDeleteAccount}
						disabled={isPending}
						className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:bg-red-700 active:scale-95 shadow-sm disabled:opacity-50"
					>
						{isPending && (
							<Loader2 size={16} className="inline animate-spin me-2" />
						)}
						{t("delete_account_btn")}
					</button>
				</div>
			</div>
		</div>
	);
}
