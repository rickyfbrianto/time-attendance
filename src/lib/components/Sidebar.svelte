<script lang="ts">
    import { ShieldUser, Clock8, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard, IdCard, Award, Share2, Settings, Ban, Save, CircleUserRound, Logs } from '@lucide/svelte'
    import usercowo from '$/lib/assets/user-man.svg'
    import { fade, fly } from 'svelte/transition'
	import { quadIn } from 'svelte/easing';
	import { Avatar, Modal, Timeline, TimelineItem, Tooltip, Hr, Badge, Label, Select, Alert, FooterBrand } from 'flowbite-svelte';
    import {appstore } from '$/lib/store/appstore'
    import { page } from '$app/state';
	import { pecahArray } from '$/lib/utils';
    import { invalidateAll } from '$app/navigation';
	import axios from 'axios';
    import { fromZodError } from 'zod-validation-error';
	import { UserSchema } from '@lib/type';
	import MyButton from './MyButton.svelte';
	import MyInput from './MyInput.svelte';
	import { format } from 'date-fns';
    import { id } from 'date-fns/locale'
	import MyImage from './MyImage.svelte';
	import MyAlert from './MyAlert.svelte';
	import MyClock from './MyClock.svelte';
	
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
        {type:"other", title:"Other", separator: true},
        {type:"other", link:"/security", title:"Security", icon: ShieldUser},
        {type:"other", link:"/Logs", title:"Logs", icon: Logs},
        {type:"admin", title:"Admin", separator: true},
        {type:"admin", link:"/admin", title:"Admin", icon: CircleUserRound},
    ]
    let defaultModal = $state(false)

    // User
    const formUserAnswer = {
        answer:{
            payroll: (()=> user.payroll)(),
            name: (()=> user.name)(),
            position: (()=> user.position)(),
            password: "",
            location: (()=> user.location)(),
            phone: (()=> user.phone)(),
            email:  (()=> user.email)(),
            approver: (()=> user.employee_employee_approverToemployee?.name || "")(),
            substitute: (()=> user.employee_employee_approverToemployee?.employee_employee_substituteToemployee?.name || "")(),
            join_date: (()=> format(user.join_date, 'd MMMM yyyy'))(),
            signature: (()=> user.signature)(),
        },
        success:"",
        error:"",
        modal:false,
        loading:false,
        add:false,
        edit:false,
    }
    
    let formUserState = $state({...formUserAnswer})

    const formUserBatal = () => formUserState = {...formUserAnswer}

    const formUserSubmit = async () =>{
        try {
            formUserState.loading = true
            const valid = UserSchema.pick({
                phone: true,
                location: true,
                signature: true
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
</script>

{#if $appstore.showSidebar}
    <div style="scrollbar-width: none;" transition:fly={{x: "-200px", easing: quadIn}} class="relative flex flex-col bg-bgside px-3 min-w-[16rem] w-[16rem] max-w-[16rem] text-textside overflow-y-scroll">
        <a class="sticky top-0 bg-bgside z-[10] flex items-center justify-center gap-3 py-[.6rem] text-textdark" href="/">
            <div class="flex h-[4.5rem]">
                <MyClock/>   
            </div>
            <div class="flex flex-col">
                <span class="text-[1.5rem] font-dancing font-[700] tracking-widest">Time</span>
                <span class="indent-5 mt-[-5px] font-quicksand text-[1.25rem]">Attendance</span>
            </div>
        </a>

        <div class="flex flex-col flex-1 gap-y-[3px]">
            {#each linkSidebar as {link, title, icon: Icon, type, separator}}            
                {#if type == "admin" && (pecahArray(userProfile?.access_profile, "R") || pecahArray(userProfile?.access_user, "R") || pecahArray(userProfile?.access_setting, "R") || pecahArray(userProfile?.access_calendar, "R") || pecahArray(userProfile?.access_dept, "R"))
                    || ["core", "main", "other"].includes(type) }                
                    {#if separator}
                        <div class="flex justify-center bg-bgside2 text-textside px-3 py-[3px] rounded-lg mt-1 shadow-xl">
                            <span class='text-muted font-bold font-quicksand text-[.75rem]'>{title}</span>
                        </div>
                    {:else}
                        <a href={link} class={`relative flex items-center ${link == "/"+pathname[0] ? "bg-gradient-to-r from-slate-800 to-gray-200 text-white":"bg-bgside2 text-textside"} hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-[4px] rounded-lg gap-3 shadow-lg`}>
                            <Icon size=14/>
                            <span class={`text-[.75rem] font-bold font-quicksand`}>{title}</span>
                        </a>
                        <Tooltip class='z-10'>{title}</Tooltip>
                    {/if}
                {/if}
            {/each}
        </div>

        <div class="relative flex flex-col mb-3 bg-bgside2 pt-5 pb-3 px-3 rounded-xl shadow-xl">
            <div class="relative flex self-center">
                <Avatar onclick={()=> defaultModal=true} src={usercowo} border class="ring-slate-600 w-[7rem] h-[7rem] mb-2"/>
                <Tooltip class='z-10'>{user.name}</Tooltip>
                <Settings onclick={()=> formUserState.modal=true} size={20} class='absolute right-[-15px]' />
                <Tooltip class='z-10'>Setting</Tooltip>
            </div>
            <span class="text-[14px] text-center font-normal text-textdark text-ellipsis line-clamp-2" title={user.name}>{user.name}</span>
            <Badge class='bg-slate-200 text-slate-800 self-center py-1'>{user.email}</Badge>
            <Tooltip class='z-10'>{user.email}</Tooltip>
            <Hr hrClass="my-3 text-slate-300 h-[1.2px]"/>
            <div class='flex flex-col gap-1 px-1 justify-center'>
                <span class="flex items-center gap-2 text-[12px] text-textdark text-ellipsis line-clamp-1"><IdCard size={14}/>{user.payroll}</span>
                <Tooltip class='z-10'>{user.payroll}</Tooltip>
                <span class="flex items-center gap-2 text-[12px] text-textdark text-ellipsis line-clamp-1"><Award size={14}/>{user.position}</span>
                <Tooltip class='z-10'>{user.position}</Tooltip>
                <span class="flex items-center gap-2 text-[12px] text-textdark text-ellipsis line-clamp-1"><Share2 size={14}/>Profile ({userProfile?.name} - Level {userProfile?.level})</span>
                <Tooltip class='z-10'>{userProfile.name}</Tooltip>
            </div>

            <span class='bg-bgside mx-[-.75rem] mb-[-.8rem] py-2 font-quicksand text-textdark text-center text-[.7rem] mt-2'>© {new Date().getFullYear()} All Rights Reserved</span>

            {#if userProfile.user_hrd}
                <div class="absolute h-[2rem] w-[4rem] flex items-center top-[-1.5rem] right-[0] rounded-t-lg bg-bgside2 px-4">
                    <span class='font-bold text-[.75rem]'>HRD</span>
                </div>
            {/if}
        </div>

        <Modal title={"My Account"} bind:open={defaultModal} autoclose>
            <div class="relative grid grid-cols-2 gap-3 items-center justify-center">
                <div class="flex flex-col gap-2 items-center justify-center">
                    <Avatar src={usercowo} border class="self-center ring-slate-600 w-[10rem] h-[10rem]"/>
                    <span class='italic'>{user.name}</span>
                    <MyImage src={import.meta.env.VITE_VIEW_SIGNATURE+user.signature} className="mt-4 border border-slate-300 rounded-xl w-[10rem] h-[10rem]" title={`Signature ${user.name}`}/>
                    <span class='italic'>Signature</span>
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

        <Modal title={"User "} bind:open={formUserState.modal} size={"lg"}>
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
                    <MyInput type='text' title='Email' disabled name="email" bind:value={formUserState.answer.email}/>
                    <MyInput type='text' title='Name' disabled name="name" bind:value={formUserState.answer.name}/>
                    <MyInput type='text' title='Position' disabled name="position" bind:value={formUserState.answer.position}/>
                    <MyInput type='text' title='Approver' disabled name="approver" bind:value={formUserState.answer.approver}/>
                    <MyInput type='text' title='Substitute' disabled name="substitute" bind:value={formUserState.answer.substitute}/>
                    <MyInput type='text' title='Join Date' disabled name="join_date" bind:value={formUserState.answer.join_date}/>
                </div>

                <div class="flex gap-2">
                    <span class="flex-1 border-b-[1px] border-slate-300 pb-2">Edit</span>
                    <MyButton onclick={formUserBatal}><Ban size={16} /></MyButton>
                    <MyButton onclick={formUserSubmit}><Save size={16}/></MyButton>
                </div>
                <div class="grid grid-cols-3 gap-4 p-4 border-[1px] border-slate-300">
                    <!-- <MyInput type='password' password={true} title='Password' name="password" bind:value={formUserState.answer.password}/> -->
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