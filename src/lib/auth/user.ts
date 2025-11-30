import type { 
    SystemRole, 
    ClinicRole, 
    CenterRole, 
    UserStatus, 
    SubscriptionStatus 
} from "$lib/server/db/generated/prisma/enums";

// ==============================
// 1. THE MAIN USER TYPE
// ==============================

/**
 * This represents the User object fully hydrated with their memberships.
 * This is what you should return from 'locals.user' in your hooks.server.ts
 */
export interface AppUser {
    id: string;
    nameAr: string;
    nameEn: string;
    phoneNumber: string;
    specialization: string ;
    
    // System Level (SaaS Admin vs Customer)
    systemRole: SystemRole;
    status: UserStatus;

    // 2. MEMBERSHIPS (The "Badges" they hold)
    clinicMemberships: Array<{
        role: ClinicRole;
        clinic: {
            id: string;
            name: string;
            status: SubscriptionStatus;
        };
    }>;

    centerMemberships: Array<{
        role: CenterRole;
        medicalCenter: {
            id: string;
            centerName: string;
            status: SubscriptionStatus;
        };
    }>;
}

// ==============================
// 2. IDENTITY ENUM & HELPER
// ==============================

export type IdentityType =
    | 'SUPER_ADMIN'
    | 'SUPPORT_AGENT'
    | 'CLINIC_OWNER'
    | 'MEDICAL_CENTER_OWNER'
    | 'DOCTOR'       // Employee in Center or Clinic
    | 'VISITOR'      // Visiting Doctor
    | 'USER';        // Just a user with no facilities yet

/**
 * Determine the "Primary" identity type for routing.
 * Since a user can have multiple roles, we prioritize:
 * Admin > Clinic Owner > Center Owner > Doctor
 */
export function whoAmI(user: AppUser | null): IdentityType {
    if (!user) return 'USER';

    // 1️⃣ Global SaaS Admin
    if (user.systemRole === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    if (user.systemRole === 'SUPPORT_AGENT') return 'SUPPORT_AGENT';

    // 2️⃣ Clinic Owner (Highest Priority Customer Role)
    // Check if they own ANY clinic
    if (user.clinicMemberships.some(m => m.role === 'OWNER')) {
        return 'CLINIC_OWNER';
    }

    // 3️⃣ Medical Center Owner
    if (user.centerMemberships.some(m => m.role === 'OWNER')) {
        return 'MEDICAL_CENTER_OWNER';
    }

    // 4️⃣ Regular Doctor (Employee)
    const isClinicEmployee = user.clinicMemberships.some(m => m.role === 'DOCTOR_EMPLOYEE');
    const isCenterDoctor = user.centerMemberships.some(m => m.role === 'DOCTOR');

    if (isClinicEmployee || isCenterDoctor) {
        return 'DOCTOR';
    }

    // 5️⃣ Visiting Doctor
    if (user.clinicMemberships.some(m => m.role === 'VISITING_DOCTOR')) {
        return 'VISITOR';
    }

    // 6️⃣ Fallback (Signed up, but no clinic assigned yet)
    return 'USER';
}

// ==============================
// 3. TYPE GUARDS (Helpers)
// ==============================

/**
 * Helper to quickly find the Clinic ID where the user is an OWNER.
 * Returns undefined if they are not an owner.
 */
export function getOwnedClinic(user: AppUser) {
    return user.clinicMemberships.find(m => m.role === 'OWNER')?.clinic;
}

/**
 * Helper to check if user has access to a specific clinic
 */
export function hasClinicAccess(user: AppUser, clinicId: string): boolean {
    return user.clinicMemberships.some(m => m.clinic.id === clinicId);
}