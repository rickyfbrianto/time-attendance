<script lang="ts">
    import { Button, Chart, Dropdown, DropdownItem } from 'flowbite-svelte';
    const {dataChart} = $props()
    const {data} = dataChart
    const options = {
        series: data.map((item:{series: number}) => item.series),
        colors: data.map((item:{colors: number|string}) => item.colors),
        labels: data.map((item:{labels: number|string}) => item.labels),
        chart: {
            height: "250px",
            width: '100%',
            type: 'donut'
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
                        show: true,
                        fontFamily: 'Poppins, sans-serif',
                        offsetY: 20
                    },
                    total: {
                        showAlways: true,
                        show: true,
                        label: dataChart.label,
                        fontFamily: 'Poppins, sans-serif',
                        formatter: function (w:any) {
                            const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                            return `${sum}k`;
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
        grid: {
            padding: {
                top: -2
            }
        },
        dataLabels: {
            enabled: false
        },
        legend: {
            position: 'bottom',
            fontFamily: 'Poppins, sans-serif'
        },
        yaxis: {
            labels: {
                formatter: (value: string | number) => value
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