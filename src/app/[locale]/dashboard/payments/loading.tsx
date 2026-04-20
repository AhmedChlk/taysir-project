import { Skeleton } from "@/components/ui/Skeleton";

export default function PaymentsLoading() {
	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<Skeleton className="h-10 w-48" />
				<div className="flex gap-3">
					<Skeleton className="h-10 w-32 rounded-xl" />
					<Skeleton className="h-10 w-44 rounded-xl" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-28 rounded-[32px]" />
				))}
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} className="h-64 rounded-[32px]" />
				))}
			</div>
		</div>
	);
}
