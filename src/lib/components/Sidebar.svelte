<script lang="ts">
    import { ShieldUser, Clock8, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard, IdCard, Award, Share2, Settings, Ban, Save, CircleUserRound, Map } from '@lucide/svelte'
    import usercowo from '$/lib/assets/user-man.svg'
    import { fade, fly } from 'svelte/transition'
	import { quadIn } from 'svelte/easing';
	import { Avatar, Modal, Timeline, TimelineItem, Tooltip, Hr, Badge, Label, Select, Accordion, AccordionItem } from 'flowbite-svelte';
    import {appstore } from '$/lib/store/appstore'
    import { page } from '$app/state';
	import { pecahArray, capitalEachWord } from '$/lib/utils';
    import { invalidateAll } from '$app/navigation';
	import axios from 'axios';
    import { fromZodError } from 'zod-validation-error';
	import { UserSchema } from '@lib/type';
	import MyButton from './MyButton.svelte';
	import MyInput from './MyInput.svelte';
	import { format } from 'date-fns';
    import { id } from 'date-fns/locale';
    import Svelecte from 'svelecte';
	import MyImage from './MyImage.svelte';
	import MyAlert from './MyAlert.svelte';
	import MyClock from './MyClock.svelte';
	import MyLoading from './MyLoading.svelte';
	
    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)
    let pathname:string[] = $state([])

    $effect(()=> {
        pathname = page.url.pathname.split('/').filter(v => v)
    })

    const linkSidebar = [
        {type:"main", title:"Menu", separator: true},
        {type:"main", link:"/dashboard", title:"Dashboard", icon: LayoutDashboard},
        {type:"main", link:"/attendance", title:"Attendance", icon: GalleryHorizontalEnd},
        {type:"main", link:"/absen", title:"Absen", icon: Clock8},
        {type:"main", link:"/lembur", title:"Lembur", icon: Hourglass},
        {type:"main", link:"/dinas", title:"Dinas", icon: Plane},
        {type:"main", link:"/ijin", title:"Ijin", icon: TicketsPlane},
        {type:"main", link:"/cuti", title:"Cuti", icon: TicketsPlane},
        {type:"main", link:"/security", title:"Security", icon: ShieldUser},
        // {type:"other", title:"Other", separator: true},
        // {type:"other", link:"/security", title:"Security", icon: ShieldUser},
        // {type:"other", link:"/logs", title:"Logs", icon: Logs},
        {type:"admin", title:"Admin", separator: true},
        {type:"admin", link:"/admin", title:"Admin", icon: CircleUserRound},
    ]
    let defaultModal = $state(false)

    // User
    const formUserAnswer = $state({
        answer:{
            payroll: (()=> user.payroll)(),
            name: (()=> user.name)(),
            position: (()=> user.position)(),
            password: "",
            location: (()=> user.location)(),
            phone: (()=> user.phone)(),
            email:  (()=> user.email)(),
            approver: (()=> user.approver || "")(),
            substitute: (()=> user.substitute || "")(),
            join_date: (()=> format(user.join_date, 'd MMMM yyyy'))(),
            signature: (()=> user.signature)(),
        },
        success:"",
        error:"",
        modal:false,
        loading:false,
        add:false,
        edit:false,
    })
    
    let formUserState = $state({...formUserAnswer})

    const formUserBatal = () => formUserState = {...formUserAnswer}

    const formUserSubmit = async () =>{
        try {
            formUserState.loading = true
            const valid = UserSchema.pick({
                phone: true,
                location: true,
                signature: true,
                approver: true,
                substitute: true,
                email: true
            })

            const formData = new FormData()
            Object.entries(formUserState.answer).forEach(([key, value])=>{
                formData.append(key, value)
            })  
            
            const isValid = valid.safeParse(formUserState.answer)
            if(isValid.success){
                const req = await axios.post('/api/user', formData)
                const res = await req.data
                formUserState.success = res.message
                setTimeout(async ()=> {
                    await invalidateAll().then(()=> {
                        formUserBatal()
                    })
                }, 1000)
            }else{
                const err = fromZodError(isValid.error)
                formUserState.success = ""
                formUserState.error = err.message
            }
        } catch (error: any) {
            formUserState.error = error.response.data.message
            formUserState.success = ""
        } finally {
            formUserState.loading = false
        }
    }

    const formUserChangePassword = async () =>{
        try {
            formUserState.loading = true
            const valid = UserSchema.pick({
                password: true,
            })
            
            const isValid = valid.safeParse(formUserState.answer)
            if(isValid.success){
                const req = await axios.post(`/api/admin/user/${formUserState.answer.payroll}/password`, {
                    payroll: formUserState.answer.payroll,
                    password: formUserState.answer.password,
                })
                
                const res = await req.data
                formUserState.success = res.message
                setTimeout(async ()=> {
                    invalidateAll().then(()=> {
                        formUserBatal()
                    })
                }, 1000)
            }else{
                const err = fromZodError(isValid.error)
                formUserState.success = ""
                formUserState.error = err.message
            }
        } catch (error: any) {
            formUserState.error = error.response.data.message
            formUserState.success = ""
        } finally {
            formUserState.loading = false
        }
    }

    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${val || ""}`)
        return await req.json()
    }
</script>

{#if $appstore.showSidebar}
    <div style="scrollbar-width: none;" transition:fly={{x: "-200px", easing: quadIn}} class="relative flex flex-col bg-bgside px-3 min-w-[16rem] w-[16rem] max-w-[16rem] text-textside overflow-y-scroll font-quicksand font-black">
        <a class="sticky top-0 bg-bgside z-[10] flex items-center justify-center gap-3 py-[.6rem] text-textdark" href="/">
            <div class="flex h-[4.5rem]">
                <MyClock/>   
            </div>
            <div class="flex flex-col">
                <div class="flex justify-between">
                    <span class="text-[1.25rem] font-dancing font-[700] tracking-widest">Time</span>
                    <Badge color='dark' class='flex items-center gap-1 self-center'>
                        <Map size={12} />
                        <span class="font-quicksand text-[.7rem] font-bold">{import.meta.env.VITE_LOCATION}</span>
                    </Badge>
                </div>
                <span class="indent-6 mt-[-5px] font-quicksand text-[1.2rem]">Attendance</span>
                <span class="mt-[-2px] font-quicksand text-[.6rem] font-bold">{import.meta.env.VITE_VERSION}</span>
            </div>
        </a>

        <!-- <div class="flex flex-col flex-1 gap-y-[3px]"> -->
        <div class="flex-1 mt-2">
            <div class="flex flex-col bg-bgside2 text-textside rounded-xl duration-500 transition-all">
                {#each linkSidebar as {link, title, icon: Icon, type, separator}}            
                    {#if type == "admin" && (pecahArray(userProfile?.access_profile, "R") || pecahArray(userProfile?.access_user, "R") || pecahArray(userProfile?.access_setting, "R") || pecahArray(userProfile?.access_calendar, "R") || pecahArray(userProfile?.access_dept, "R"))
                        || ["core", "main", "other"].includes(type)}                
                            {#if separator}
                                <div class="flex justify-center py-[.4rem] shadow-xl border-b border-stone-300">
                                    <span class='text-muted font-bold font-quicksand text-[.75rem]'>{title}</span>
                                </div>
                            {:else}
                                <!-- <a href={link} class={`relative flex items-center ${link == "/"+pathname[0] ? "bg-gradient-to-r from-stone-500 to-transparent  text-white":"bg-bgside2 text-textside"} hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-[.4rem] rounded-lg gap-2 shadow-lg`}>
                                    <Icon size=14/>
                                    <span class={`text-[.68rem] font-bold font-quicksand`}>{title}</span>
                                </a> -->
                                <a href={link} class={`relative flex items-center px-3 py-[.4rem] gap-2 border-b border-stone-200 hover:bg-gradient-to-r dark:hover:from-zinc-500 hover:from-zinc-200 hover:to-transparent hover:text-textside ${link == "/"+pathname[0] ? "bg-gradient-to-r from-zinc-200 dark:from-zinc-500 to-transparent  text-textside shadow-lg":"bg-bgside2 text-textside"}`}>
                                    <Icon size=14/>
                                    <span class={`text-[.68rem] font-bold font-quicksand`}>{title}</span>
                                </a>
                            {/if}
                    {/if}
                {/each}
            </div>
        </div>

        <div class="relative flex flex-col mb-3 bg-bgside2 pt-4 pb-3 px-3 rounded-xl shadow-xl">
            <Settings onclick={()=> formUserState.modal=true} size={20} class='absolute left-[15px] top-[15px] cursor-pointer' />
            <Tooltip class='z-10'>Setting</Tooltip>
            <div class="relative flex self-center">
                <Avatar onclick={()=> defaultModal=true} src={usercowo} border class="ring-slate-600 w-[5rem] h-[5rem] mb-2"/>
                <Tooltip class='z-10'>{user.name}</Tooltip>
            </div>
            <span class="text-[.75rem] text-center text-textdark text-ellipsis line-clamp-2" title={user.name}>{user.name}</span>
            <Badge class='bg-slate-200 text-slate-800 self-center py-1'>{user.email}</Badge>
            <Tooltip class='z-10'>{user.email}</Tooltip>
            <Hr hrClass="my-2 text-slate-300"/>
            <div class='flex flex-col gap-[2px] px-1 justify-center'>
                <span class="flex items-center gap-2 text-[.7rem] text-textdark text-ellipsis line-clamp-1"><IdCard size={14}/>{user.payroll}</span>
                <Tooltip class='z-10'>{user.payroll}</Tooltip>
                <span class="flex items-center gap-2 text-[.7rem] text-textdark text-ellipsis line-clamp-1"><Award size={14}/>{user.position}</span>
                <Tooltip class='z-10'>{user.position}</Tooltip>
                <span class="flex items-center gap-2 text-[.7rem] text-textdark text-ellipsis line-clamp-1"><Share2 size={14}/>Profile ({userProfile?.name} - Level {user.level})</span>
                <Tooltip class='z-10'>{userProfile?.name}</Tooltip>
            </div>
            
            <span class='bg-bgside mx-[-.75rem] mb-[-.8rem] py-[.75em] font-quicksand font-bold text-textdark text-center text-[.7rem] mt-2 rounded-b-xl'>© {new Date().getFullYear()} All Rights Reserved</span>

            {#if user.user_type == 'HR'}
                <div class="absolute h-[2rem] w-[4rem] flex items-center top-[-1.5rem] right-[0] rounded-t-lg bg-bgside2 px-4">
                    <span class='font-bold text-[.75rem]'>HRD</span>
                </div>
            {/if}
        </div>

        <Modal title={"Akun saya"} bind:open={defaultModal} autoclose>
            <div class="relative grid grid-cols-2 gap-3 items-center justify-center">
                <div class="flex flex-col gap-2 items-center justify-center">
                    <Avatar src={usercowo} border class="self-center ring-slate-600 w-[8rem] h-[8rem]"/>
                    <span class='italic text-[.9rem]'>{user.name}</span>
                    <MyImage src={import.meta.env.VITE_VIEW_SIGNATURE+user.signature} className="mt-4 border border-slate-300 rounded-xl w-[8rem] h-[8rem]" title={`Signature ${user.name}`}/>
                    <span class='italic text-[.9rem]'>Signature</span>
                </div>
                <div class="flex flex-col">
                    <Timeline >
                        <TimelineItem title={user.payroll} date="Payroll"/>
                        <TimelineItem title={user.position} date="Position"/>
                        <TimelineItem title={user.location} date="Location"/>
                        <TimelineItem title={user.email} date="Email"/>
                        <TimelineItem title={format(user.join_date, "d MMMM yyyy", {locale: id})} date="Join Date"/>
                    </Timeline>
                </div>
            </div>
        </Modal>

        <Modal title={"User "} bind:open={formUserState.modal} size={"xl"}>
            {#if formUserState.error}
                {#each formUserState.error.split(';') as v}
                    <MyAlert pesan={v} func={()=> formUserState.error = ""} color='red'/>
                {/each}
            {:else if formUserState.success}
                <MyAlert pesan={formUserState.success} func={()=> formUserState.success = ""} color='green'/>
            {/if}
            <form transition:fade={{duration:500}} class='flex flex-col gap-4 p-4 border border-slate-300 rounded-lg' enctype="multipart/form-data">
                <span class="border-b-[1px] border-slate-300 pb-2">Basic</span>
                <div class="grid grid-cols-3 gap-4 p-4 border-[1px] border-slate-300">
                    <MyInput type='text' title='Payroll' disabled name="payroll" bind:value={formUserState.answer.payroll}/>
                    <MyInput type='text' title='Name' disabled name="name" bind:value={formUserState.answer.name}/>
                    <MyInput type='text' title='Position' disabled name="position" bind:value={formUserState.answer.position}/>
                    <MyInput type='text' title='Join Date' disabled name="join_date" bind:value={formUserState.answer.join_date}/>
                </div>

                <div class="flex gap-2">
                    <span class="flex-1 border-b-[1px] border-slate-300 pb-2">Edit</span>
                    <MyButton onclick={formUserBatal}><Ban size={16} /></MyButton>
                    <MyButton onclick={formUserSubmit}><Save size={16}/></MyButton>
                </div>
                <div class="grid grid-cols-3 gap-4 p-4 border-[1px] border-slate-300">
                    <MyInput type='text' title='Email' name="email" bind:value={formUserState.answer.email}/>

                    {#await getUser('')}
                        <MyLoading message="Loading user data"/>
                    {:then val}
                        <div class="flex flex-col gap-2">
                            <Label>Approver</Label>
                            <Svelecte clearable searchable selectOnTab multiple={false} optionClass='' bind:value={formUserState.answer.approver} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " | " + capitalEachWord(v.name)}))}
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <Label>Substitute</Label>
                            <Svelecte clearable searchable selectOnTab multiple={false} optionClass='' bind:value={formUserState.answer.substitute} 
                                options={val.map((v:any) => ({value: v.payroll, text:v.payroll + " | " + capitalEachWord(v.name)}))}
                            />
                        </div>
                    {/await}

                    <MyInput type='text' title='Phone' name="phone" bind:value={formUserState.answer.phone}/>
                    <div class="flex flex-col gap-2">
                        <Label for='location'>Location</Label>
                        <Select name='location' items={[
                            {value:"Jakarta", name:"Jakarta"},
                            {value:"Samarinda", name:"Samarinda"},
                            {value:"Other", name:"Other"},
                        ]} bind:value={formUserState.answer.location} />
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <Label>Signature</Label>
                        <input class="rounded-lg border border-slate-300" type="file" accept=".jpg" onchange={(e: any) => formUserState.answer.signature = e.target.files[0]}/>
                    </div>
                </div>

                <div class="flex gap-2">
                    <span class="flex-1 border-b-[1px] border-slate-300 pb-2">Change Password</span>
                    <MyButton onclick={formUserBatal}><Ban size={16} /></MyButton>
                    <MyButton onclick={formUserChangePassword}><Save size={16}/></MyButton>
                </div>
                <div class="grid grid-cols-3 gap-4 p-4 border-[1px] border-slate-300">
                    <MyInput type='password' password={true} title='Password' name="password" bind:value={formUserState.answer.password}/>
                </div>
            </form>
        </Modal>
    </div>
{/if}