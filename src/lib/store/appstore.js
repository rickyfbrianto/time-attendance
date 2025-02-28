import { writable } from "svelte/store";

export const appstore = writable({
	showSidebar: true,
});
