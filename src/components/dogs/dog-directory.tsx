"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { PawSummary } from "@/features/paws/queries";
import { DogCard } from "./dog-card";
import { Button } from "../ui/button";

export function DogDirectory({ paws }: { paws: PawSummary[] }) {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("All");
  const [sex, setSex] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = useMemo(
    () => paws.filter((pup) => `${pup.name} ${pup.breed ?? ""} ${pup.location} ${pup.code}`.toLowerCase().includes(query.toLowerCase()) && (size === "All" || pup.size === size.toUpperCase()) && (sex === "All" || pup.sex === sex.toUpperCase())),
    [paws, query, size, sex],
  );
  const activeFilters = [size, sex].filter((value) => value !== "All").length;

  function clearFilters() {
    setSize("All");
    setSex("All");
  }

  const filters = (
    <div className="space-y-6">
      <FilterGroup title="Size" name="size" values={["All", "Small", "Medium", "Large"]} selected={size} onSelect={setSize} />
      <FilterGroup title="Sex" name="sex" values={["All", "Male", "Female", "Unknown"]} selected={sex} onSelect={setSex} />
      {activeFilters > 0 && <button type="button" className="text-sm font-bold text-[var(--primary-hover)]" onClick={clearFilters}>Clear filters</button>}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 border-y border-[var(--line)] py-4 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1 sm:max-w-2xl">
          <span className="sr-only">Search paw profiles</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full min-w-0 rounded-[8px] border border-[var(--line)] bg-[var(--paper)] pl-10 pr-3 text-base placeholder:text-[#9a8e84] focus:border-[var(--primary)] focus:outline-none"
            placeholder="Search name, Paw ID, breed, or locality"
          />
        </label>
        <Button variant="secondary" className="w-full shrink-0 sm:w-auto lg:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal size={17} /> Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </Button>
        <p className="text-sm text-[var(--muted)] sm:ml-auto">
          <strong className="text-[var(--charcoal)]">{filtered.length}</strong> published {filtered.length === 1 ? "profile" : "profiles"}
        </p>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden border-r border-[var(--line)] pr-6 lg:block">
          <div className="mb-6 flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={17} className="text-[var(--primary)]" />Filters</div>
          {filters}
        </aside>
        <div className="min-w-0">
          {filtered.length ? (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((pup) => <DogCard key={pup.code} dog={pup} />)}
            </div>
          ) : (
            <div className="border-y border-[var(--line)] py-14 text-center">
              <h2 className="text-xl font-bold">No published paws match</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Try another name, locality, size, or sex.</p>
              <Button className="mt-5" onClick={() => { setQuery(""); clearFilters(); }}>See every published paw</Button>
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/35" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <aside className="absolute inset-y-0 right-0 w-[min(90vw,360px)] overflow-y-auto border-l border-[var(--line)] bg-[var(--paper)] p-5">
            <div className="mb-7 flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div><p className="eyebrow">Paw directory</p><h2 className="mt-1 text-xl font-bold">Filter profiles</h2></div>
              <button className="focus-ring p-2" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button>
            </div>
            {filters}
            <Button className="mt-7 w-full" onClick={() => setFiltersOpen(false)}>Show {filtered.length} paws</Button>
          </aside>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, name, values, selected, onSelect }: { title: string; name: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">{title}</legend>
      <div className="mt-3 grid gap-2.5">
        {values.map((value) => (
          <label key={value} className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--muted)]">
            <input type="radio" name={name} value={value} checked={selected === value} onChange={() => onSelect(value)} className="mt-0.5 accent-[var(--primary)]" />
            <span>{value}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
