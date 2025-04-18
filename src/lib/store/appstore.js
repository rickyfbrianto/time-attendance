import { writable } from "svelte/store";

export const appstore = writable({
	showSidebar: true,
	appWidth: 0,
	darkMode: false,
});
