import { Skeleton } from "@/components/ui/Skeleton";

export default function StudentsLoading() {
	return (
		<div className="space-y-10 pb-20 pt-16">
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-2">
					<Skeleton className="h-10 w-72" />
					<Skeleton className="h-4 w-96" />
				</div>
			</div>
			<div className="space-y-3">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-16 w-full rounded-2xl" />
				))}
			</div>
		</div>
	);
}
