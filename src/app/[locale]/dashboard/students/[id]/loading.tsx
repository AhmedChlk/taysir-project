import { Skeleton } from "@/components/ui/Skeleton";

export default function StudentProfileLoading() {
	return (
		<div className="space-y-8 pb-20">
			<div className="flex items-center gap-4">
				<Skeleton className="w-12 h-12 rounded-2xl" />
				<div className="space-y-2">
					<Skeleton className="h-3 w-32" />
					<Skeleton className="h-8 w-56" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
				<Skeleton className="col-span-8 h-64 rounded-[32px]" />
				<div className="col-span-4 space-y-4">
					<Skeleton className="h-28 rounded-[32px]" />
					<Skeleton className="h-28 rounded-[32px]" />
				</div>
			</div>
			<Skeleton className="h-96 w-full rounded-[32px]" />
		</div>
	);
}
