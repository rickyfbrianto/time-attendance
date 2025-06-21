<script>
    import { Chart, registerables } from 'chart.js';
    import ChartDataLabels from 'chartjs-plugin-datalabels';

    let {chartData, chartOptions, chartClass, type = 'bar'} = $props()
    
    let canvas;
    let chartInstance;

    Chart.register(...registerables);
    
    $effect(() => {
        if (canvas) {
            chartInstance = new Chart(canvas, {
                type,
                data: chartData,
                options: chartOptions,
                plugins: [ChartDataLabels]
            });
        }

        return () => chartInstance?.destroy()
    });

    if (chartInstance && chartData) {
        chartInstance.data = chartData;
        chartInstance.update();
    }
</script>

<canvas bind:this={canvas} class={chartClass}></canvas>
