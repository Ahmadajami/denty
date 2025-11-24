/* eslint-disable @typescript-eslint/no-explicit-any */
import { superValidate, message } from 'sveltekit-superforms/server';
import type { PageServerLoad } from './$types';
import { reportLastStep } from '$lib/zod/session';
import { zod4 } from 'sveltekit-superforms/adapters';
import { initialTeethData, initToothstyle } from '$lib/shared/tooth/chartData';
import { fail } from '@sveltejs/kit';
import { crudPatientSchema } from '$lib/zod/patient';
import nodemailer from 'nodemailer';

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
			// Find if this tooth has a treatment
			const treatment = toothTreatments.find((t) => t.toothNumber === Number(tooth.key));

			// Determine color
			let fill = 'white'; // default
			if (treatment && treatment.treatmentId) {
				const tDetails = treatmentMap.get(treatment.treatmentId);
				if (tDetails) {
					const group = groupMap.get(tDetails.groupId);
					if (group) fill = group.color;
				} else {
					fill = '#3b82f6';
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

	// 2. Build the Table Rows
	const rows = toothTreatments
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

export const actions = {
	new_session: async ({ request, fetch }) => {
		console.log('Server action called');
		const form = await superValidate(request, zod4(reportLastStep));

		if (!form.valid) return fail(400, { form });

		console.log('Form is valid. Preparing PDF...');

		try {
			// --- 1. FETCH DATA CONTEXT ---
			const groupsRes = await fetch('/dashboard/api/treatment-groups.json');
			const groupsData = await groupsRes.json();
			const groupMap = new Map<string, any>(groupsData.map((g: any) => [g.id, g]));

			const treatmentMap = new Map<string, any>();
			await Promise.all(
				groupsData.map(async (group: any) => {
					const res = await fetch(`/dashboard/api/treatment.json/${group.id}`);
					const treatments = await res.json();
					treatments.forEach((t: any) => treatmentMap.set(t.id, t));
				})
			);

			const htmlContent = generateReportHtml(
				form.data.phone,
				form.data.toothTreatments,
				treatmentMap,
				groupMap
			);

			let browser;

			// Vercel / Production Environment
			if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
				const chromium = await import('@sparticuz/chromium-min');
				const puppeteer = await import('puppeteer-core');

				chromium.default.setGraphicsMode = false;

				browser = await puppeteer.default.launch({
					args: chromium.default.args,
					defaultViewport: { width: 1920, height: 1080 },
					executablePath: await chromium.default.executablePath(),
					headless: true // Hardcoded true for serverless
				});
			}
			// Local Development Environment
			else {
				const puppeteer = await import('puppeteer');
				// launch() calls the local Chrome binary.
				// If this fails, run `npx puppeteer browsers install chrome`
				browser = await puppeteer.default.launch({
					headless: true,
					args: ['--no-sandbox', '--disable-setuid-sandbox']
				});
			}

			const page = await browser.newPage();
			await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
			const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
			await browser.close();

			// --- 3. SEND EMAIL ---
			const transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'YOUR_GMAIL_ADDRESS@gmail.com', // ENV VAR RECOMMENDED
					pass: 'xxxx xxxx xxxx xxxx' // APP PASSWORD
				}
			});

			await transporter.sendMail({
				from: '"Dental Clinic" <YOUR_GMAIL_ADDRESS@gmail.com>',
				to: 'doctor@example.com',
				subject: `New Session Report - ${form.data.phone}`,
				text: `A new session has been recorded for patient ${form.data.phone}.`,
				attachments: [
					{
						filename: `session-${Date.now()}.pdf`,
						content: Buffer.from(pdfBuffer)
					}
				]
			});

			console.log('Email sent successfully');
		} catch (error) {
			console.error('Error processing session:', error);
			// Optional: return fail(500, { form, error: 'Failed to generate PDF' })
		}

		return message(form, 'Session saved and report emailed!');
	}
};
