<script lang='ts'>
    import { TableHandler, Datatable, ThSort, ThFilter} from '@vincjo/datatables'
    
    let {data} = $props()
    
    // const table = new TableHandler(data.data,{rowsPerPage: 10, })
    const table = new TableHandler(data.data, {rowsPerPage: 10, })

    const fetchData = async ()=>{
        const req = await fetch('/api/admin/profile')
        return await req.json()
    }
</script>

<main>    
    <!-- <select value={item}>
        {#each [5,10,15] as item}
            <option value={item}>{item}</option>
        {/each}
    </select> -->
    
    <div class="flex">

    </div>
    <Datatable basic {table}>
        <table>
            <thead>
                <tr>
                    <ThSort {table} field="profile_id">First Name</ThSort>
                    <ThSort {table} field="name">Last Name</ThSort>
                    <ThSort {table} field="description">Email</ThSort>
                </tr>
                <tr>
                    <ThFilter {table} field="profile_id"/>
                    <ThFilter {table} field="name" />
                    <ThFilter {table} field="description"/>
                </tr>
            </thead>
            <tbody>
                {#each table.rows as row}
                    <tr>
                        <td>{row.profile_id}</td>
                        <td>{row.name}</td>
                        <td>{row.description}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </Datatable>
</main>