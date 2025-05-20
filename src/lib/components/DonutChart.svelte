<script lang="ts">
    import { Chart } from 'flowbite-svelte';
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
            colors: ['transparent'],
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
                        },
                        total: {
                            showAlways: true,
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
                            formatter: function (value: string | number) { return value}
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
        dataLabels: {
            enabled: true,
        },
        legend: {
            position: 'left',
            fontFamily: 'Poppins, sans-serif',
            formatter: (value: string) => value
        },
        yaxis: {
            labels: {
                formatter: (value: string ) => value + " day",
            }
        },
        xaxis: {
            labels: {
                formatter: (value: string | number) => value
            },
            axisTicks: {
                show: false
            },
            axisBorder: {
                show: false
            }
        }
    };
</script>

<main>
    <Chart {options} class='py-4' />
</main>