/* eslint-disable @typescript-eslint/no-explicit-any */
import { superValidate, fail, message } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { reportLastStep } from '$lib/zod/session';
import { zod4 } from 'sveltekit-superforms/adapters';
import { crudPatientSchema } from '$lib/zod/patient';
import nodemailer from 'nodemailer';
import { DOPPIO_API_KEY, GMAILAPP } from '$env/static/private';
import { getCatalog } from '$lib/server/treatment';
import { db } from '$lib/server/prisma';
import { initialTeethData, initToothstyle } from '$lib/shared/tooth/chartData';

export const load: PageServerLoad = async ({ url }) => {
	// 1. Initialize Forms
	// reportLastStep covers the full multi-step session data
	const form = await superValidate(zod4(reportLastStep));
	const patientForm = await superValidate(zod4(crudPatientSchema));

	// 2. Get Context
	// If coming from the patient list, we might have a phone number in the URL
	const phoneNumber = url.searchParams.get('phone');

	// 3. Fetch Catalog
	// Use the new service function to get Groups with nested Treatments.
	// This structure (catalog -> treatments) is better for the UI accordion/grouping.
	const catalog = await getCatalog();

	return {
		form,
		patientForm,
		phoneNumber,
		catalog
	};
};

// --- HELPER: Generate HTML for PDF ---
function generateReportHtml(
	phone: string,
	toothTreatments: any[],
	treatmentMap: Map<string, any>,
	groupMap: Map<string, any>
) {
	// 1. Construct the SVG string manually
	const svgContent = initialTeethData
		.map((tooth, index) => {
			const style = initToothstyle[index];
			// Find ALL treatments for this tooth
			const treatmentsForTooth = toothTreatments.filter((t) => t.toothNumber === Number(tooth.key));

			// Determine color: use the color of the LAST added treatment
			let fill = 'white'; // default
			if (treatmentsForTooth.length > 0) {
				// Get the last one
				const lastTreatment = treatmentsForTooth[treatmentsForTooth.length - 1];
				if (lastTreatment && lastTreatment.treatmentId) {
					const tDetails = treatmentMap.get(lastTreatment.treatmentId);
					if (tDetails) {
						const group = groupMap.get(tDetails.groupId);
						if (group) fill = group.color;
					} else {
						fill = '#3b82f6';
					}
				}
			}

			// Render Element based on type
			if (style.type === 'polygon') {
				return `<polygon points="${style.coords}" fill="${fill}" fill-opacity="0.6" stroke="#333" stroke-width="1" />`;
			} else {
				return `<path d="${style.coords}" fill="${fill}" fill-opacity="0.6" stroke="#333" stroke-width="1" />`;
			}
		})
		.join('\n');

	// 2. Build the Table Rows (Sorted by Tooth Number)
	const sortedTreatments = [...toothTreatments].sort((a, b) => a.toothNumber - b.toothNumber);

	const rows = sortedTreatments
		.map((t) => {
			const details = treatmentMap.get(t.treatmentId);
			const group = details ? groupMap.get(details.groupId) : null;
			const treatmentName = details ? details.name || details.nameAr : 'Unknown';
			const groupName = group ? group.name || group.nameAr : '-';
			const color = group ? group.color : '#ccc';

			return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold;">#${t.toothNumber}</td>
                <td style="padding: 8px;">${treatmentName}</td>
                <td style="padding: 8px;">
                    <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:50%; margin-right:5px;"></span>
                    ${groupName}
                </td>
            </tr>`;
		})
		.join('');

	// 3. Full HTML Document
	return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #111; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 5px; }
            .container { display: flex; gap: 40px; }
            .chart { width: 400px; height: 600px; position: relative; }
            .table-container { flex: 1; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 8px; background: #eee; }
        </style>
    </head>
    <body>
        <h1>Dental Session Report</h1>
        <div class="info">
            <strong>Patient Phone:</strong> ${phone}<br/>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}
        </div>
        <div class="container">
            <div class="chart">
                <h3 style="text-align:center; margin-bottom:10px;">Dental Chart</h3>
                <svg viewBox="0 0 450 700" width="400" height="600" xmlns="http://www.w3.org/2000/svg">
                    <g id="Spots">${svgContent}</g>
                </svg>
            </div>
            <div class="table-container">
                <h3>Treatment Details</h3>
                <table>
                    <thead>
                        <tr><th>Tooth</th><th>Treatment</th><th>Group</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    </body>
    </html>`;
}

export const actions: Actions = {
	new_session: async ({ request, fetch, locals }) => {
		const form = await superValidate(request, zod4(reportLastStep));

		if (!form.valid) {
			return fail(400, { form });
		}

		const user = locals.user;
		if (!user) return fail(401, { form });

		/* ---------------------------------------------------------
           1. RESOLVE CONTEXT (Clinic vs Medical Center)
           --------------------------------------------------------- */
		// We prioritize ownership, then employment.
		let clinicId: string | null = null;
		let medicalCenterId: string | null = null;

		// Check Clinic (Owner or Employee)
		const clinicMembership = user.clinicMemberships.find((m) =>
			['OWNER', 'DOCTOR_EMPLOYEE'].includes(m.role)
		);
		if (clinicMembership) {
			// FIX: Access ID via nested object, not scalar (as per app.d.ts)
			clinicId = clinicMembership.clinic.id;
		}

		// Check Medical Center (Owner or Doctor)
		// If no clinic context found, check center.
		if (!clinicId) {
			const centerMembership = user.centerMemberships.find((m) =>
				['OWNER', 'DOCTOR'].includes(m.role)
			);
			if (centerMembership) {
				// FIX: Access ID via nested object, not scalar (as per app.d.ts)
				medicalCenterId = centerMembership.medicalCenter.id;
			}
		}

		if (!clinicId && !medicalCenterId) {
			return fail(403, { form, error: 'No active clinic or medical center membership found.' });
		}

		/* ---------------------------------------------------------
           2. FIND PATIENT
           --------------------------------------------------------- */
		const patient = await db.patient.findUnique({
			where: { phoneNumber: form.data.phone }
		});

		if (!patient) {
			return fail(404, { form, error: 'Patient not found' });
		}

		/* ---------------------------------------------------------
           3. SAVE TO DATABASE
           --------------------------------------------------------- */
		try {
			// Extract unique IDs for the Many-to-Many relation
			const uniqueTreatmentIds = [...new Set(form.data.toothTreatments.map((t) => t.treatmentId))];
			const uniqueTeeth = [...new Set(form.data.toothTreatments.map((t) => t.toothNumber))];

			await db.treatmentSession.create({
				data: {
					patientId: patient.id,
					doctorId: user.id,
					clinicId,
					medicalCenterId,
					price: form.data.totalPrice,
					toothNumbers: uniqueTeeth,

					// Connect multiple treatments to this single session
					treatments: {
						connect: uniqueTreatmentIds.map((id) => ({ id }))
					}
				}
			});
		} catch (e) {
			console.error('DB Save Error', e);
			return fail(500, { form, error: 'Database Error' });
		}

		/* ---------------------------------------------------------
           4. GENERATE PDF & SEND EMAIL
           --------------------------------------------------------- */
		let emailSent = false;

		try {
			// A. Fetch Data Context for PDF Generation
			const groups = await db.treatmentGroup.findMany();
			const groupMap = new Map(groups.map((g) => [g.id, g]));

			const treatments = await db.treatment.findMany();
			const treatmentMap = new Map(treatments.map((t) => [t.id, t]));

			// B. Generate HTML
			const htmlContent = generateReportHtml(
				form.data.phone,
				form.data.toothTreatments,
				treatmentMap,
				groupMap
			);

			if (!DOPPIO_API_KEY) throw new Error('DOPPIO_API_KEY is not configured.');

			// C. Render PDF
			const encodedHTML = Buffer.from(htmlContent, 'utf8').toString('base64');
			const doppioRes = await fetch('https://api.doppio.sh/v1/render/pdf/direct', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${DOPPIO_API_KEY}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					page: {
						setContent: { html: encodedHTML },
						pdf: {
							printBackground: true,
							format: 'A4',
							margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
						}
					}
				})
			});

			if (!doppioRes.ok) {
				const errorText = await doppioRes.text();
				throw new Error(`Doppio API Error: ${doppioRes.status} - ${errorText}`);
			}

			const pdfArrayBuffer = await doppioRes.arrayBuffer();
			const pdfBuffer = Buffer.from(pdfArrayBuffer);

			// D. Send Email
			const transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'a.alajami963@gmail.com', // Recommend moving to env variable
					pass: GMAILAPP
				}
			});

			await transporter.sendMail({
				from: 'Dental Clinic System',
				to: 'ahmad_2000_aj@hotmail.com', // In prod, maybe use patient.email or user.email
				subject: `New Session Report - ${patient.fullnameEn}`,
				text: `A new session has been recorded for patient ${patient.fullnameEn}.`,
				attachments: [
					{
						filename: `session-${Date.now()}.pdf`,
						content: pdfBuffer
					}
				]
			});

			emailSent = true;
		} catch (error) {
			console.error('❌ Error processing session PDF/Email:', error);
			// We do NOT fail the request here, because the DB save was successful.
			// We just warn the user.
		}

		return message(form, emailSent ? 'SUCCESS' : 'WARNING_EMAIL_FAILED');
	}
};
