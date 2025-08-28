<script lang='ts'>
    import '$/flatpickr.css'
    type modeProps = "multiple" | "single"
    import flatpickr from "flatpickr";
    import MyInput from '@/MyInput.svelte';
    import { Indonesian } from 'flatpickr/dist/l10n/id.js'
	import { formatDateToSQLString, formatTanggal } from "@lib/utils";
	import { format } from 'date-fns';
        
    let {value = $bindable(), mode = "single", 
        time = false, disabled = false, listHariLibur = [],
        option={}
    } = $props()
    
    let ref = $state()
    
    let inputValue = $state(value)

    $effect(() => {
        if (!ref) return;
        const a = disabled
		const picker = flatpickr(ref, {
            enableTime: ['range', 'multiple'].includes(mode) ? false : time,
            weekNumbers: true,
            mode: mode,
			allowInput: true,
			clickOpens: true,
            time_24hr: true,
            enableSeconds: true,
            altInput: true,
            altFormat: ['range', 'multiple'].includes(mode) ? "j F Y" : (time ? 'j F Y H:i:S' : "j F Y"),
            dateFormat: ['range', 'multiple'].includes(mode) ? 'Y-m-d' : (time ? 'Y-m-d H:i:S' : 'Y-m-d'),
            defaultDate: value,
            onClose: function(selectedDates, dateStr, instance) {
                if(['range','multiple'].includes(mode)){
                    const formatted = selectedDates.map(date => formatDateToSQLString(date)).sort()
                    inputValue = formatted
                } else {
                    inputValue = dateStr
                }
            },
            "locale": {
                ...Indonesian,
                "firstDayOfWeek": 1, // start week on Monday
                "rangeSeparator": " s/d "
            },
            onDayCreate: function(dObj, dStr, fp, dayElem) {
                const dateStr = format(dayElem.dateObj, "yyyy-MM-dd")
                
                if (listHariLibur.includes(dateStr)) {
                    dayElem.innerHTML  += "<span class='event'></span>"
                }
            },
            ...option
		})

        flatpickr.localize

        if (mode === 'multiple' && Array.isArray(value) && value.length > 0) {
            picker.setDate(value, true); // true = triggerChange
        }
	});

    $effect(()=> {        
        value = inputValue
    })
</script>

<MyInput {disabled} type="text" bind:ref={ref} placeholder="Select Date.."/>