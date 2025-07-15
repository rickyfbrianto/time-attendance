<script>
	import { hitungDifference, formatDifference } from "$/lib/utils";
    import MyBadge from '@/MyBadge.svelte';
    import { Plus } from '@lucide/svelte'

    let {check_in, check_out, check_in2, check_out2, overtime} = $props()
    const {hour, minute} = hitungDifference(check_in, check_out, check_in2, check_out2)

    const isOvertime = (hour > 0) || (hour == 0 && minute >= overtime)
</script>

{#if isOvertime}
    <MyBadge color={"green"}>
        <Plus size={12} color={"#FFFFFF"}/>
        {formatDifference({hour, minute, overtime, round_up: false})}
    </MyBadge>
{/if}