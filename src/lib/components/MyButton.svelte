<script lang='ts'>
    import classNames from 'classnames'
    let {type="button", size="md", children, onclick, className = "", disabled = false } : {type?:"button" | "submit" | "reset" | null | undefined, size?: "sm"|"md"|"lg", children: any, onclick?: ()=>void, className?:string, disabled?:boolean} = $props()
    const myClass = classNames(`MyButton ${size == "sm" ? "p-1":(size == "md" ? "p-2": (size == "lg" ?"p-3":"p-0"))} border border-slate-300 rounded-lg ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`, className)
</script>

<button {disabled} class={myClass} {onclick}>{@render children()}</button>