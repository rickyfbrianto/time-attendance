// import type { State } from '@vincjo/datatables/remote';

import { json } from "@sveltejs/kit";
import type { State } from "@vincjo/datatables/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const searchProfile = async (state: State) => {
    const req = await prisma.profile.findMany({
        where:{
            name:{contains:state.search},
            description:{contains:state.search},
        }
    })
    return {data:"re"}
};

export const getParams = (state: State) => {
	const { rowsPerPage, sort, filters, search, offset, currentPage } = state;

    let params =""

    if(currentPage){
        params = `_page=${currentPage}`;
    }
	if (rowsPerPage) {
		params += `&_limit=${rowsPerPage}`;
	}
	if (offset) {
		params += `&_offset=${offset}`;
	}
	if (sort) {
		params += `&_sort=${String(sort.field)}&_order=${sort.direction}`;
	}
	if (filters) {
		params += filters.map(({ filterBy, value }) => `&${filterBy}=${value}`).join();
	}
	if (search) {
		params += `&_search=${search}`;
	}
	return params;
};