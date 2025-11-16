import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { clinicSchema, medicalSchema } from '$lib/auth';

export const load: PageServerLoad = async () => {
	// Different schemas, no id required according to the docs
	const clinicForm = await superValidate(zod4(clinicSchema));
	const medicalForm = await superValidate(zod4(medicalSchema));

	// Return both forms
	return { clinicForm, medicalForm };
};
