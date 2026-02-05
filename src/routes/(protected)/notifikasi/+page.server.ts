import { base } from "$app/paths"

export async function load({ parent, fetch }) {
    const { user } = await parent()
    const reqNotif = await fetch(`${base}/api/data?type=get_notif&payroll=${user?.payroll || ""}`)
    const notif = await reqNotif.json()

    return {
        notif
    }
}