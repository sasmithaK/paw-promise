"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { PawSummary } from "@/features/paws/queries";
import { DogCard } from "./dog-card";
import { Button } from "../ui/button";

export function DogDirectory({ paws }: { paws: PawSummary[] }) {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("All");
  const [sex, setSex] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = useMemo(() => paws.filter(pup => `${pup.name} ${pup.breed ?? ""} ${pup.location} ${pup.code}`.toLowerCase().includes(query.toLowerCase()) && (size === "All" || pup.size === size.toUpperCase()) && (sex === "All" || pup.sex === sex.toUpperCase())), [paws, query, size, sex]);
  const activeFilters = [size, sex].filter(value => value !== "All").length;
  function clearFilters() { setSize("All"); setSex("All"); }

  const filters = <div className="space-y-6"><FilterGroup title="Size" name="size" values={["All","Small","Medium","Large"]} selected={size} onSelect={setSize}/><FilterGroup title="Sex" name="sex" values={["All","Male","Female","Unknown"]} selected={sex} onSelect={setSex}/><Button variant="secondary" size="sm" className="w-full" onClick={clearFilters}>Clear filters</Button></div>;

  return <div>
    <div className="rounded-[16px] border border-[var(--line)] bg-[var(--paper)] p-2 shadow-[0_8px_28px_rgba(87,53,34,.06)] sm:flex sm:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]" size={20}/><input value={query} onChange={event=>setQuery(event.target.value)} className="h-12 w-full min-w-0 rounded-[10px] border-0 bg-transparent pl-11 pr-3 text-base placeholder:text-[#9a8e84] focus:outline-none" placeholder="Search by name, Paw ID, breed, or locality…" aria-label="Search paw profiles"/></div><Button variant="secondary" className="mt-2 w-full shrink-0 sm:mt-0 sm:w-auto lg:hidden" onClick={()=>setFiltersOpen(true)}><SlidersHorizontal size={17}/>Filters{activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-[var(--primary)] text-[10px] text-white">{activeFilters}</span>}</Button></div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--muted)]"><strong className="text-[var(--charcoal)]">{filtered.length}</strong> published paw {filtered.length === 1 ? "profile" : "profiles"}</p>{activeFilters > 0 && <button className="text-sm font-bold text-[var(--primary-hover)] lg:hidden" onClick={clearFilters}>Reset filters</button>}</div>
    <div className="mt-5 grid gap-7 lg:grid-cols-[190px_minmax(0,1fr)] xl:gap-9"><aside className="hidden border-r border-[var(--line)] pr-6 lg:block"><div className="mb-6 flex items-center gap-2 font-bold"><SlidersHorizontal size={18} className="text-[var(--primary)]"/>Narrow the list</div>{filters}</aside><div className="min-w-0">{filtered.length ? <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(pup=><DogCard key={pup.code} dog={pup}/>)}</div> : <div className="card grid min-h-64 place-items-center p-8 text-center"><div><Sparkles className="mx-auto text-[var(--primary)]"/><h2 className="mt-4 text-xl font-bold">No published paws match</h2><p className="mt-2 text-sm text-[var(--muted)]">Try another name, locality, size, or sex.</p><Button className="mt-5" onClick={()=>{setQuery("");clearFilters();}}>See every published paw</Button></div></div>}</div></div>
    {filtersOpen && <div className="fixed inset-0 z-50 bg-black/35 lg:hidden" onClick={()=>setFiltersOpen(false)}><div className="absolute inset-y-0 right-0 w-[min(90vw,380px)] overflow-y-auto bg-[var(--paper)] p-5 shadow-xl" onClick={event=>event.stopPropagation()}><div className="mb-7 flex items-center justify-between"><div><p className="eyebrow">Paw directory</p><h2 className="mt-1 text-xl font-bold">Filter profiles</h2></div><button className="focus-ring rounded p-2" onClick={()=>setFiltersOpen(false)} aria-label="Close filters"><X/></button></div>{filters}<Button className="mt-7 w-full" onClick={()=>setFiltersOpen(false)}>Show {filtered.length} paws</Button></div></div>}
  </div>;
}

function FilterGroup({ title, name, values, selected, onSelect }: { title: string; name: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <div><p className="text-sm font-bold">{title}</p><div className="mt-3 grid gap-2.5">{values.map(value => <label key={value} className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--muted)]"><input type="radio" name={name} value={value} checked={selected===value} onChange={() => onSelect(value)} className="mt-0.5 accent-[var(--primary)]"/><span>{value}</span></label>)}</div></div>;
}
