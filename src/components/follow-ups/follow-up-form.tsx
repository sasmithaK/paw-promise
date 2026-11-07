"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createFollowUpAction } from "@/features/milestone-five/actions";
import { Button } from "@/components/ui/button";

type Option={id:string;label:string};
const control="h-11 w-full rounded-[10px] border border-[var(--line)] bg-white px-3 font-normal";

export function FollowUpForm({paws,members,currentUserId}:{paws:Option[];members:Option[];currentUserId:string}) {
  const [state,action,pending]=useActionState(createFollowUpAction,{ok:false,message:""});
  return <form action={action} className="card mt-6 grid gap-4 p-5 lg:grid-cols-2"><div className="lg:col-span-2"><h2 className="flex items-center gap-2 text-xl font-bold"><Plus size={19}/>Create a follow-up</h2><p className="mt-1 text-sm text-[var(--muted)]">Coordinate the next care action without changing the historical record.</p></div><Field label="Paw profile"><select name="dogId" required className={control}><option value="">Choose a pup</option>{paws.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Assign to"><select name="assignedTo" defaultValue={currentUserId} className={control}>{members.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Task"><input name="title" required maxLength={160} className={control} placeholder="Arrange the next vaccination"/></Field><Field label="Due date"><input type="datetime-local" name="dueAt" className={control}/></Field><label className="grid gap-2 text-sm font-bold lg:col-span-2">Notes<textarea name="description" maxLength={2000} className="min-h-24 rounded-[10px] border border-[var(--line)] bg-white p-3 font-normal" placeholder="Add only the context needed to complete this task."/></label>{state.message&&<p role="status" className={`rounded-[10px] p-3 text-sm lg:col-span-2 ${state.ok?"bg-[var(--primary-soft)] text-[var(--primary-hover)]":"bg-[#fff2e9] text-[var(--cocoa)]"}`}>{state.message}</p>}<div className="flex justify-end lg:col-span-2"><Button type="submit" disabled={pending||!paws.length}>{pending?"Creating…":"Create follow-up"}</Button></div></form>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="grid gap-2 text-sm font-bold">{label}{children}</label>}
