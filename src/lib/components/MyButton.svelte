<script lang='ts'>
    import classNames from 'classnames'
    let {type="button", children, onclick, className = "" } : {type?:"button" | "submit" | "reset" | null | undefined, children: any, onclick?: ()=>void, className?:string} = $props()
    const myClass = classNames(`p-3 border border-slate-300 rounded-lg cursor-pointer`, className)
</script>

<button {type} class={myClass} {onclick}>{@render children()}</button>