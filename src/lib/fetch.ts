import { createQuery } from "@tanstack/svelte-query"
import { getMonth, getYear } from "date-fns"

export const getCutiUser = async (payroll: string, year: number = getYear(new Date()), month: number = getMonth(new Date()) + 1) => {
    const req = await fetch(`/api/data?type=get_cuti_user&val=${payroll}&year=${year}&month=${month}`)
    const res = await req.json()
    return res
}

export const tesUser = (val: string) => {
    return createQuery(()=> {
        return {
            queryKey: ['tesUser'],
            queryFn: async () => {
                const req = await fetch(`/api/data?type=dept&val=${val}`).then(r => r.json())
                return req
            },
        }
    })
}

export const useProfile = () => {
    return createQuery(()=> ({
        queryKey: ['useProfile'],
        queryFn: async () => {
            const req = await fetch('/api/data?type=profile').then(r => r.json())
            return req
        },
    }))
}

export const useDept = (val:string = '') => {
    return createQuery(()=> {
        return {
            queryKey: ['useDept', val],
            queryFn: async () => {
                const req = await fetch(`/api/data?type=dept&val=${val}`).then(r => r.json())
                return req
            },
        }
    })
}

export const useUserByDept = (val:string = '') => {
    return createQuery(()=> {
        return {
            queryKey: ['useUserByDept', val],
            queryFn: async () => {
                const req = await fetch(`/api/data?type=user_by_dept&val=${val || ""}`).then(r => r.json())
                return req
            },
        }
    })
}

// const getDept = async (val:string = '')=>{
//     const req = await fetch(`/api/data?type=dept&val=${val}`)
//     const res = await req.json()
//     return res
// }