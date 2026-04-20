import { WidgetSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
	return (
		<div className="min-h-screen bg-taysir-bg p-4 md:p-10">
			<div className="h-16 w-64 rounded-2xl bg-taysir-teal/5 animate-pulse mb-12" />
			<div className="max-w-[1400px] mx-auto space-y-10">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
					<WidgetSkeleton className="col-span-8 min-h-[280px]" />
					<WidgetSkeleton className="col-span-4 min-h-[280px]" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
					<WidgetSkeleton className="col-span-4 min-h-[240px]" />
					<WidgetSkeleton className="col-span-8 min-h-[240px]" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
					<WidgetSkeleton className="col-span-4 min-h-[200px]" />
					<WidgetSkeleton className="col-span-8 min-h-[200px]" />
				</div>
			</div>
		</div>
	);
}
