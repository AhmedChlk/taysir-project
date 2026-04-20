import { Skeleton } from "@/components/ui/Skeleton";

export default function GroupsLoading() {
	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<Skeleton className="h-10 w-56" />
				<Skeleton className="h-10 w-36 rounded-xl" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-28 rounded-2xl" />
				))}
			</div>
			<Skeleton className="h-80 w-full rounded-3xl" />
		</div>
	);
}
