// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
            code?: string,
            id?: string
        }
		interface Locals {
            user: string | null | {}
        }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
