import { writable } from "svelte/store";

export const appstore = writable({
	showSidebar: true,
	appWidth: 0,
	darkMode: false
});

export const dataSample = writable([
	{ id: 1, maker: "Toyota", type: "ABC", make: 2017 },
	{ id: 2, maker: "Ford", type: "CDE", make: 2018 },
	{ id: 3, maker: "Volvo", type: "FGH", make: 2019 },
	{ id: 4, maker: "Saab", type: "IJK", make: 2020 },
]);