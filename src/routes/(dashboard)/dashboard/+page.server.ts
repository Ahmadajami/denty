import { message, superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';

import { fail } from '@sveltejs/kit';
import { crudPatientSchema } from '$lib/zod/patient';
import { createPatient } from '$lib/server/patient';

export const load = (async () => {
	return { patientForm: await superValidate(zod4(crudPatientSchema)) };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		console.log('Server action called');

		// Validate form data
		const patientForm = await superValidate(request, zod4(crudPatientSchema));

		if (!patientForm.valid) {
			console.log('Form invalid');
			return fail(400, { patientForm });
		}

		console.log('Form is valid on server:', patientForm.data);

		// Access logged-in user from hooks
		const user = locals.user;

		if (!user) {
			return fail(401, { patientForm, message: 'Unauthorized' });
		}

		try {
			// Create the patient
			const newPatient = await createPatient(user, patientForm.data);

			console.log('Patient created successfully:', newPatient);

			// Return success message
			return message(patientForm, {
				message: 'Patient created successfully',
				close: true
			});
		} catch (err) {
			console.error('Error creating patient:', err);
			return fail(500, { patientForm, message: 'Failed to create patient' });
		}
	}
};
