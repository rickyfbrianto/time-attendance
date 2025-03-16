import type { State } from "@vincjo/datatables/server";

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