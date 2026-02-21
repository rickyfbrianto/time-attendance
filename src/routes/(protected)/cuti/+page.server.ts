import { base } from "$app/paths";
import { getMonth, getYear } from "date-fns";
import type { LayoutServerLoad } from "../$types";

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
    const {user} = locals
    let year = getYear(new Date());
    let month = getMonth(new Date()) + 1;
    const reqCuti = await fetch(`${base}/api/data?type=get_cuti_user&val=${user.payroll}&year=${year}&month=${month}`);
    const resCuti = await reqCuti.json();
    
    return {
        user_cuti: Object.entries(resCuti).map(([title, value]) => ({ title, value: value as string }))
    }
}