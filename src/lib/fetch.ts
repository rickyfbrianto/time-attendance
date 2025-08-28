import { getMonth, getYear } from "date-fns"

export const getCutiUser = async (payroll: string, year: number = getYear(new Date()), month: number = getMonth(new Date()) + 1) => {
    const req = await fetch(`/api/data?type=get_cuti_user&val=${payroll}&year=${year}&month=${month}`)
    const res = await req.json()
    return res
}