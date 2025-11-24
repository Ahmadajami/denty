import { superValidate, message } from 'sveltekit-superforms/server';
import type { PageServerLoad } from './$types';
import { reportLastStep } from '$lib/zod/session';
import { zod4 } from 'sveltekit-superforms/adapters';

import { fail } from '@sveltejs/kit';
import { crudPatientSchema } from '$lib/zod/patient';

export const load: PageServerLoad = async ({ url }) => {
	const form = await superValidate(zod4(reportLastStep));
	const patientForm = await superValidate(zod4(crudPatientSchema));
	const PhoneNumber = url.searchParams.get('phone');

	return {
		form,
		PhoneNumber,
		patientForm
	};
};
export const actions = {
	new_session: async ({ request }) => {
		console.log('Server action called');
		const form = await superValidate(request, zod4(reportLastStep));

		console.log(form);

		if (!form.valid) return fail(400, { form });
		console.log('Form is valid on server');
		console.log(form);

		return message(form, 'Form posted successfully!');
	}
};
