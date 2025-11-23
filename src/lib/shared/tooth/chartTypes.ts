export type ToothItem = {
	id: string;
	key: string;
	color: string;
	checked: boolean;
};

export type ToothLabel = {
	id: string;
	label: string;
	transform: string;
	checked: boolean;
};

export type ToothStyle = {
	type: 'polygon' | 'path';
	coords: string;
};
