import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {};
	}

	console.log(locals.user.type);
	return { user: locals.user };
};
