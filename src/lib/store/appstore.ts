import { writable } from "svelte/store";

export const appstore = writable({
    showSidebar: true,
    appWidth: 0,
    darkMode: false,
});

interface ReportAttendanceProps {
    dept: string;
    year: string;
    month: string
}

export const reportAttendance = writable<ReportAttendanceProps | null>(null);