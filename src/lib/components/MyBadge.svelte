<script lang='ts'>
    import classNames from 'classnames'
    let {children, italic = false, bold = false, underline = false, border = false, onclick= ()=> {}, size = "sm", color = "default", className = ""}: 
    {children: any, italic?: boolean, bold?: boolean, underline?: boolean, border?: boolean, onclick?: ()=> void, size?: "sm"|"md"|"lg", color?: "red"|"blue"|"green"|"yellow"|"dark"|"default", className?: string} = $props()
    const myClass = classNames(`flex gap-1 items-center px-2 rounded-xl py-[2px] text-[.7rem] min-w-fit
        ${italic ? "italic" : ""}
        ${bold ? "font-bold" : ""}
        ${underline ? "underline" : ""}
        ${border ? "border-slate-300 border-[1px]" : ""}
        ${size == "sm" ? "min-h-5 " : (size == "md" ? "min-h-[26px]" : (size == "lg" ? "min-h-8" : ""))}
        ${color == "dark" ? "bg-slate-700 text-slate-100" : (color == "red" ? "bg-red-400 text-slate-100" : (color == "blue" ? "bg-biru text-slate-100" : (color == "green" ? "bg-hijau text-slate-100" : (color == "yellow" ? "bg-kuning text-slate-800" : "bg-slate-200 text-slate-800"))))}
    `, className)
</script>

<button {onclick} class={myClass}>
    {@render children()}
</button>