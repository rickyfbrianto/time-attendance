import { base } from "$app/paths"
import type { LayoutServerLoad } from "../$types"

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
    const { user } = await locals
    const reqNotif = await fetch(`${base}/api/data?type=get_notif&payroll=${user?.payroll || ""}`)
    const notif = await reqNotif.json()

    return {
        notif
    }
}