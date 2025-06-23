<script lang="ts">
    import { ShieldUser, Clock8, GalleryHorizontalEnd, TicketsPlane, Hourglass, Plane, LayoutDashboard, IdCard, Award, Share2, Settings, Ban, Save } from '@lucide/svelte'
    import usercowo from '$/lib/assets/user-man.svg'
    import usercewe from '$/lib/assets/user-woman.svg'
    import { fade, fly } from 'svelte/transition'
	import { quadIn } from 'svelte/easing';
	import { Card, Avatar, Modal, Timeline, TimelineItem, Tooltip, Hr, Badge, Label, Select, Alert } from 'flowbite-svelte';
    import {appstore } from '$/lib/store/appstore'
    import { page } from '$app/state';
	import { pecahArray } from '$/lib/utils';
    import { invalidateAll } from '$app/navigation';
	import axios from 'axios';
    import { fromZodError } from 'zod-validation-error';
	import { UserSchema } from '@lib/type';
	import { z } from 'zod';
	import MyButton from './MyButton.svelte';
	import MyInput from './MyInput.svelte';
	import { format } from 'date-fns';
	
    let {data} = $props()
    let user = $derived(data.user) 
    let userProfile = $derived(data.userProfile)
    let pathname:string[] = $state([])

    $effect(()=>{
        pathname = page.url.pathname.split('/').filter(v => v)
    })
        
    const linkSidebar = [
        {type:"separator", title:"Core"},
        {link:"/dashboard", title:"Dashboard", icon: LayoutDashboard},
        {link:"/attendance", title:"Attendance", icon: GalleryHorizontalEnd},
        {type:"separator", title:"Main"},
        {link:"/absen", title:"Check In/Out", icon: Clock8},
        {link:"/lembur", title:"Lembur", icon: Hourglass},
        {link:"/dinas", title:"Dinas", icon: Plane},
        {link:"/ijin", title:"Ijin", icon: TicketsPlane},
        {link:"/cuti", title:"Cuti", icon: TicketsPlane},
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
            approver: (()=> user.employee_employee_approverToemployee.name)(),
            substitute: (()=> user.employee_employee_approverToemployee.employee_employee_substituteToemployee.name)(),
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

    const getUser = async (val: string = "") =>{
        const req = await fetch(`/api/data?type=user_by_dept&val=${val || ""}`)
        return await req.json()
    }
</script>

{#if $appstore.showSidebar}
    <div style="scrollbar-width: none;" transition:fly={{x: "-200px", easing: quadIn}} class="relative flex flex-col bg-bgside px-3 min-w-[16rem] w-[16rem] max-w-[16rem] text-textside overflow-y-scroll">
        <a class="sticky top-0 bg-bgside z-[10] flex items-center justify-center gap-3 py-[.6rem] text-textdark" href="/">
            <Clock8 size={44}/>        
            <div class="flex flex-col">
                <span class="text-[1.2rem] font-[700]">Time</span>
                <span class="indent-6 mt-[-5px] text-[1.1rem]">Attendance</span>
            </div>
        </a>

        <div class="flex flex-col flex-1 gap-y-1">
            {#each linkSidebar as {link, title, icon: Icon, type}}
                {#if type == "separator"}
                    <div class="flex justify-center bg-bgside2 text-textside px-3 py-1 rounded-lg mt-1 shadow-xl">
                        <span class='text-muted font-bold italic text-[.7rem]'>{title}</span>
                    </div>
                {:else}
                    <a href={link} class={`relative flex items-center ${link == "/"+pathname[0] ? "bg-gradient-to-r from-slate-800 to-gray-200 text-white":"bg-bgside2 text-textside"} hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-2 rounded-lg gap-3 shadow-lg`}>
                        <Icon size=14/>
                        <span class={`text-[.75rem] font-bold `}>{title}</span>
                    </a>
                    <Tooltip class='z-10'>{title}</Tooltip>
                {/if}
            {/each}
            {#if pecahArray(userProfile?.access_profile, "R") || pecahArray(userProfile?.access_user, "R") || pecahArray(userProfile?.access_setting, "R") || pecahArray(userProfile?.access_calendar, "R") || pecahArray(userProfile?.access_dept, "R")}
                <div class="flex justify-center bg-bgside2 text-textside px-3 py-1 rounded-lg mt-1 shadow-xl">
                    <span class='text-muted font-bold italic text-[.7rem]'>Admin</span>
                </div>
                <a href={'/admin'} class={`relative flex items-center ${'/admin' == "/"+pathname[0] ? "bg-gradient-to-r from-slate-800 to-gray-200 text-white":"bg-bgside2 text-textside"} hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-2 rounded-lg gap-3 shadow-lg`}>
                    <ShieldUser size=14/>
                    <span class={`text-[.75rem] font-bold `}>Admin</span>
                </a>
                <Tooltip class='z-10'>Admin</Tooltip>
            {/if}
        </div>

        <div class="relative flex flex-col mb-5 mt-12 bg-bgside2 py-5 px-3 rounded-xl shadow-xl">
            <div class="relative flex self-center">
                <Avatar onclick={()=> defaultModal=true} src={usercowo} border class="ring-slate-600 w-[7rem] h-[7rem] mb-2"/>
                <Tooltip class='z-10'>{user.name}</Tooltip>
                <Settings onclick={()=> formUserState.modal=true} size={20} class='absolute right-[-15px]' title="tes" />
                <Tooltip class='z-10'>Setting</Tooltip>
            </div>
            <span class="text-[14px] text-center font-normal text-textdark text-ellipsis line-clamp-2" title={user.name}>{user.name}</span>
            <Badge class='bg-slate-200 text-slate-800 self-center py-1' title={user.email}>{user.email}</Badge>
            <Tooltip class='z-10'>{user.email}</Tooltip>
            <Hr hrClass="my-3 text-slate-300 h-[1.2px]"/>
            <div class='flex flex-col gap-1 px-1'>
                <span class="flex gap-2 text-[12px] text-textdark text-ellipsis line-clamp-1" title={user.payroll}><IdCard size={14}/>{user.payroll}</span>
                <Tooltip class='z-10'>{user.payroll}</Tooltip>
                <span class="flex gap-2 text-[12px] text-textdark text-ellipsis line-clamp-1" title={user.position}><Award size={14}/>{user.position}</span>
                <Tooltip class='z-10'>{user.position}</Tooltip>
                <span class="flex gap-2 text-[12px] text-textdark text-ellipsis line-clamp-1" title={userProfile.name}><Share2 size={14}/>Profile ({userProfile?.name} - Level {userProfile?.level})</span>
                <Tooltip class='z-10'>{userProfile.name}</Tooltip>
                <!-- <span class="text-[12px] text-textdark">{user.position}</span>
                <span class="text-[12px] text-textdark">Profile ({userProfile?.name} - Level {userProfile?.level}) </span> -->
                <!-- <span class="text-[12px] text-textdark">{user.email}</span> -->
            </div>

            {#if userProfile.user_hrd}
                <div class="absolute h-[2.5rem] flex items-center top-[-2.5rem] left-[50%] translate-x-[-50%] bg-bgside2 px-4 rounded-t-xl">
                    <span class='font-bold text-[.9rem]'>HRD User</span>
                </div>
            {/if}
        </div>

        <Modal title={"My Account"} bind:open={defaultModal} autoclose>
            <div class="relative grid grid-cols-2 gap-3 items-center justify-center">
                <div class="flex flex-col gap-2 items-center justify-center">
                    <Avatar src={usercowo} border class="self-center ring-slate-600 w-[8rem] h-[8rem]"/>
                    <span class='italic'>{user.name}</span>
                    <img src={import.meta.env.VITE_VIEW_SIGNATURE+user.signature} alt="Signature" class="border border-slate-300 rounded-xl w-[7rem] h-[7rem] p-2" title={`Signature ${user.name}`}/>
                    <span class='italic'>Signature</span>
                </div>
                <div class="flex flex-col">
                    <Timeline>
                        <TimelineItem title={user.payroll} date="Payroll"/>
                        <TimelineItem title={user.position} date="Position"/>
                        <TimelineItem title={user.location} date="Location"/>
                        <TimelineItem title={user.email} date="Email"/>
                    </Timeline>
                </div>
            </div>
        </Modal>

        <Modal title={"User "} bind:open={formUserState.modal} size={"lg"}>
            {#if formUserState.error}
                {#each formUserState.error.split(';') as v}
                    <Alert dismissable>
                        <span>{v}</span>
                    </Alert>
                {/each}
            {:else if formUserState.success}
                <Alert border color="green" dismissable>
                    <span>{formUserState.success}</span>
                </Alert>
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
                        <input class="rounded-lg border border-slate-300" type="file" accept=".jpg" onchange={e => formUserState.answer.signature = e.target.files[0]}/>
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