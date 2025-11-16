import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { clinicSchema, medicalSchema } from '$lib/auth';
import { fail } from 'sveltekit-superforms';

export const load: PageServerLoad = async () => {
	// Different schemas, no id required according to the docs
	const clinicForm = await superValidate(zod4(clinicSchema));
	const medicalForm = await superValidate(zod4(medicalSchema));

	// Return both forms
	return { clinicForm, medicalForm };
};

export const actions: Actions = {
	clinicAccount: async ({ request }) => {
		console.log('form is fire');
		// validate incoming form data
		const clinicForm = await superValidate(request, zod4(clinicSchema));

		if (!clinicForm.valid) {
			console.log("Clinic Form isn't valid");
			return fail(400, { clinicForm });
		}

		console.log(' Form is Valid Clinic Account :', clinicForm.data);

		//redirect(307, localizeHref(`/login?phone=${clinicForm.data.phone.replace(/\s/g, '')}`));
	},
	medicalAccount: async ({ request }) => {
		console.log('form is fire');
		// validate incoming form data
		const medicalForm = await superValidate(request, zod4(medicalSchema));

		if (!medicalForm.valid) {
			console.log("Medical Form isn't valid");
			return fail(400, { medicalForm });
		}

		console.log(' Form is Valid Medical Account :', medicalForm.data);
	}
};
