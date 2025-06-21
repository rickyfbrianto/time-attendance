<script>
	import { hitungDifference, formatDifference } from "$/lib/utils";
    import { Badge } from 'flowbite-svelte';

    let {check_in, check_out, check_in2, check_out2, overtime} = $props()

    const {hour, minute} = hitungDifference(check_in, check_out, check_in2, check_out2)
    const isOvertime = (hour > 0) || (hour == 0 && minute >= overtime)
</script>

{#if isOvertime}
    <Badge rounded color={"green"}>
        + {formatDifference({hour, minute})}
    </Badge>
{/if}