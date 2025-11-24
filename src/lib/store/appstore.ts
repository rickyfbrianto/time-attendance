import { writable } from "svelte/store";

export const appstore = writable({
    showSidebar: true,
    appWidth: 0,
    darkMode: false,
});

interface DataStoreProps {
    dashboardIjinCuti: any[];
}

export const dataStore = writable<DataStoreProps>({
    dashboardIjinCuti: []
})

interface ReportAttendanceProps {
    dept: string;
    year: string;
    month: string
}

export const reportAttendance = writable<ReportAttendanceProps | null>(null);