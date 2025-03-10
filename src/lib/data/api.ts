// import type { State } from '@vincjo/datatables/remote';

import { json } from "@sveltejs/kit";
import type { State } from "@vincjo/datatables/server";
import { PrismaClient } from "@prisma/client";

export const searchProfile = async (state: State) => {
    const prisma = new PrismaClient()
    // const req = await fetch('/admin/profile')
    // const res = await req.json()
    // return res
    // // return new Promise(res => {
    // //     res(json({data:"rere"}))
    // // })
    return await prisma.profile.findMany({
        where:{
            name:{contains:state.search},
            description:{contains:state.search},
        }
    })
};

export const getParams = (state: State) => {
	const { rowsPerPage, sort, filters, search } = state;

	// let params = `_page=${pageNumber}`;
    let params =""

	if (rowsPerPage) {
		params += `_limit=${rowsPerPage}`;
	}
	if (sort) {
		params += `&_sort=${sort.field}&_order=${sort.direction}`;
	}
	if (filters) {
		params += filters.map(({ filterBy, value }) => `&${filterBy}=${value}`).join();
	}
	if (search) {
		params += `&q=${search}`;
	}
	return params;
};