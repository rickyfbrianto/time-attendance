<script>
	import { formatDifference2, hitungDifference } from "@lib/utils";
    import { Badge } from 'flowbite-svelte';

    let {check_in, check_out, check_in2, check_out2, overtime} = $props()

    const hoursA = hitungDifference(check_out, check_in).hours;
    const minutesA = hitungDifference(check_out, check_in).minutes;

    const hoursB = hitungDifference(check_out2, check_in2).hours;
    const minutesB = hitungDifference(check_out2, check_in2).minutes;

    const totalMinutes = (hoursA * 60 + minutesA) + (hoursB * 60 + minutesB);

    const resultHours = Math.floor(totalMinutes / 60);
    const resultMinutes = totalMinutes % 60;
</script>

{#if resultMinutes >= overtime && check_in != check_out}
    <Badge rounded color={"green"}>
        {resultMinutes >= overtime ? "+" : ""}
        {formatDifference2(resultHours, resultMinutes)}
    </Badge>
{/if}