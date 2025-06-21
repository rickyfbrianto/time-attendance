<script>
    // const tes = {
    //     nama: "ricky",
    //     umur: 29,
    //     status: true
    // }

    // const temp = ((hei) => ({ nama: hei.nama, umur: hei.umur }))(tes)

    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)
    
    const temp = {
        hrd: () => userProfile.user_hrd ? true : false,
        isStaff: () => userProfile.level > 1 ? "" : user?.payroll,
        payroll: (() => userProfile.user_hrd ? "ada" : "kosong"),
    }
    
    const tes = $state({...temp})

    const gantiNilai = () => {
        tes.payroll = (tes.payroll == "kosong") ? "ada" : "kosong"
    }



    const config = {
        type: 'bar',
        data,
        options: {
            plugins: {
            legend: {
                display: false
            },
            datalabels: {
                anchor: 'end',
                align: 'start',
                color: '#000',
                font: {
                weight: 'bold'
                },
                formatter: (value) => value // Tampilkan angka persis di atas bar
            }
            },
            responsive: true,
            scales: {
            y: {
                beginAtZero: true
            }
            }
        },
    };
</script>

<div class="flex">
    <div class="flex flex-col">
        {JSON.stringify(tes)}
        <button class="p-2 bg-red-400 self-start" onclick={gantiNilai}>Change</button>
    </div>
</div>