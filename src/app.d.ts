// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
            code?: string,
            id?: string
        }
		interface Locals {
            user: {
                payroll:string
			} | null | string,
            userProfile: {
                access_attendance:string,
			} | null | string | any,
        }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@event-calendar/core';

export {};
