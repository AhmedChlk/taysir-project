import type React from "react";

export const IconWrapper = ({
	children,
	size = 20,
	...props
}: React.SVGProps<SVGSVGElement> & {
	children: React.ReactNode;
	size?: number;
}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.75"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		{children}
	</svg>
);

export const Check = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => (
	<IconWrapper {...props}>
		<polyline points="20 6 9 17 4 12" />
	</IconWrapper>
);

export const ArrowR = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => (
	<IconWrapper {...props}>
		<line x1="5" y1="12" x2="19" y2="12" />
		<polyline points="12 5 19 12 12 19" />
	</IconWrapper>
);
