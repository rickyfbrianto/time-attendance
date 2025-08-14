<script lang='ts'>
    type modeProps = "multiple" | "single"
    import flatpickr from "flatpickr";
    import MyInput from '@/MyInput.svelte';
	import { formatTanggal } from "@lib/utils";
    
    let {value = $bindable(), mode = "single", 
        time = false, disabled = false, 
        option={}
    } = $props()
    
    let ref = $state()

    function formatDateToSQLString(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mi = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    }
    
    let inputValue = $state(value)
    let picker
    
    $effect(() => {
        const a = disabled
		picker = flatpickr(ref, {
            enableTime: ['range', 'multiple'].includes(mode) ? false : time,
            weekNumbers: true,
            mode,
			allowInput: true,
			clickOpens: true,
            time_24hr: true,
            enableSeconds: true,
            altInput: true,
            altFormat: ['range', 'multiple'].includes(mode) ? "j F Y" : (time ? 'j F Y H:i:S' : "j F Y"),
            dateFormat: ['range', 'multiple'].includes(mode) ? 'Y-m-d' : (time ? 'Y-m-d H:i:S' : 'Y-m-d'),
            // defaultDate: ['range', 'multiple'].includes(mode) ? [value] : value,
            defaultDate: value,
            onClose: function(selectedDates, dateStr, instance) {
                if(['range', 'multiple'].includes(mode)){
                    const formatted = selectedDates.map(date => formatTanggal(date)).sort()
                    inputValue = formatted
                } else {
                    inputValue = dateStr
                }
            },
            "locale": {
                ...flatpickr.l10ns.id,
                "firstDayOfWeek": 1, // start week on Monday
                "rangeSeparator": " s/d "
            },
            ...option
		});
        flatpickr.localize
	});

    $effect(()=> {
        // if(['range', 'multiple'].includes(mode)){
        //     value = inputValue
        // }
        
        // console.log(inputValue, value)
        value = inputValue
    })
</script>

<MyInput {disabled} type="text" bind:ref={ref} placeholder="Select Date.."/>
<!-- <MyInput {disabled} type="text" bind:ref={ref} bind:value={value} placeholder="Select Date.."/> -->