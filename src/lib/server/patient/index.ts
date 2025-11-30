import { db } from '$lib/server/prisma';

import { crudPatientSchema } from '$lib/zod/patient'; 

import { sanitizePhoneNumber } from '$lib/utils';
import type { AppUser } from '$lib/auth/user';

/**
 * Creates a patient and links them to ALL facilities where the user 
 * has a 'Working' role (Owner, Employee, Doctor).
 * * It DOES NOT link to facilities where the user is just a VISITOR.
 */
export async function createPatient(user: AppUser, input: unknown) {
    // 1. Validate input
    const parsed = crudPatientSchema.parse(input);
    const { fullname, fullnameAr, phone } = parsed;
    const phoneNumber = sanitizePhoneNumber(phone);

    // 2. Determine Scope: Where should this patient be registered?
    
    // A. Clinics: Owner or Employee
    const connectedClinicIds = user.clinicMemberships
        .filter(m => m.role === 'OWNER' || m.role === 'DOCTOR_EMPLOYEE')
        .map(m => ({ id: m.clinic.id }));

    // B. Medical Centers: Owner or Doctor
    const connectedCenterIds = user.centerMemberships
        .filter(m => m.role === 'OWNER' || m.role === 'DOCTOR')
        .map(m => ({ id: m.medicalCenter.id }));

    // 3. Create Record
    return await db.patient.create({
        data: {
            fullnameEn: fullname, 
            fullnameAr: fullnameAr,
            phoneNumber: phoneNumber,
            createdById: user.id,
            
            // Connect to all valid facilities found
            clinics: { 
                connect: connectedClinicIds 
            },
            medicalCenters: { 
                connect: connectedCenterIds 
            }
        },
        include: {
            clinics: true,
            medicalCenters: true
        }
    });
}

/**
 * Searches for patients based on the User's sophisticated RBAC.
 * * - Owners/Employees see ALL patients in their facility.
 * - Visitors see ONLY patients shared with them via 'PatientAccess'.
 */
export async function searchPatients(user: AppUser, query: string) {
    if (!user) return [];
    
    const phoneNumber = sanitizePhoneNumber(query);
    if (!phoneNumber) return [];

    // 1. Collect IDs for "Full Access" Facilities
    // (Where user is Owner or Regular Employee)
    const fullAccessClinicIds = user.clinicMemberships
        .filter(m => m.role === 'OWNER' || m.role === 'DOCTOR_EMPLOYEE')
        .map(m => m.clinic.id);

    const fullAccessCenterIds = user.centerMemberships
        .filter(m => m.role === 'OWNER' || m.role === 'DOCTOR')
        .map(m => m.medicalCenter.id);

    // 2. Construct the Security Filter
    // The user can see the patient IF:
    const securityFilter = {
        OR: [
            // A. Patient belongs to a Clinic where I am Owner/Employee
            { 
                clinics: { 
                    some: { id: { in: fullAccessClinicIds } } 
                } 
            },
            // B. Patient belongs to a Center where I am Owner/Doctor
            { 
                medicalCenters: { 
                    some: { id: { in: fullAccessCenterIds } } 
                } 
            },
            // C. I have specific Visitor Access to this patient
            // (Works even if I am a VISITING_DOCTOR)
            { 
                doctorAccess: { 
                    some: { doctorId: user.id } 
                } 
            }
        ]
    };

    // 3. Execute Query
    const patients = await db.patient.findMany({
        where: {
            phoneNumber: { contains: phoneNumber }, // Base search
            ...securityFilter // Applied security
        },
        select: {
            id: true,
            fullnameEn: true,
            fullnameAr: true,
            phoneNumber: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return patients;
}