<script lang="ts">
    import { Button, Chart, Dropdown, DropdownItem } from 'flowbite-svelte';
    const { data, label} = $props()
    
    const options = {
        series: data.map((item:{series: number}) => item.series),
        colors: data.map((item:{colors: number|string}) => item.colors),
        labels: data.map((item:{labels: number|string}) => item.labels),
        chart: {
            height: "250px",
            width: '100%',
            type: "pie"
        },
        stroke: {
            colors: ['white'],
            lineCap: ''
        },
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        name: {
                            show: false,
                            fontFamily: 'Poppins, sans-serif',
                            offsetY: 20,
                            textColor:"#FFF",
                        },
                        total: {
                            showAlways: true,
                            textColor:"#FFF",
                            show: true,
                            fontFamily: 'Poppins, sans-serif',
                            formatter: function (w:any) {
                                const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                return `${sum} days`;
                            }
                        },
                        value: {
                            show: true,
                            fontFamily: 'Poppins, sans-serif',
                            offsetY: -20,
                            formatter: (value: string | number) => value 
                        }
                    },
                    size: '80%'
                }
            }
        },
        // grid: {
        //     padding: {
        //         top: -2
        //     }
        // },
        // dataLabels: {
        //     enabled: false
        // },
        // legend: {
        //     position: 'bottom',
        //     fontFamily: 'Poppins, sans-serif'
        // },
        // yaxis: {
        //     labels: {
        //         formatter: (value: string | number) => value
        //     }
        // },
        // xaxis: {
        //     labels: {
        //         formatter: (value: string | number) => value
        //     },
        //     axisTicks: {
        //         show: false
        //     },
        //     axisBorder: {
        //         show: false
        //     }
        // }
    };
</script>

<main>
    <Chart {options} class='py-4' />
</main>