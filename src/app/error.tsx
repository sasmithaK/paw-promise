"use client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="grid min-h-screen place-items-center bg-[var(--ivory)] p-6"><div className="card max-w-md p-8 text-center"><AlertCircle className="mx-auto text-[var(--terracotta)]" size={42}/><h1 className="mt-5 text-2xl font-bold">Something did not load</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Your information has not been submitted. Check your connection and try again.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></div>}
