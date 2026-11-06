export type Dog = {
  code: string;
  name: string;
  breed: string;
  age: string;
  sex: "Male" | "Female" | "Unknown";
  size: "Small" | "Medium" | "Large";
  location: string;
  status: "In community care" | "Receiving treatment" | "Ready for adoption";
  image: string;
  updates: number;
  lastSeen: string;
  featured?: boolean;
};

export const dogs: Dog[] = [
  { code: "PP-000142", name: "Milo", breed: "Sri Lankan village mix", age: "About 2 years", sex: "Male", size: "Medium", location: "Tholangamuwa area", status: "In community care", image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=85", updates: 12, lastSeen: "Yesterday", featured: true },
  { code: "PP-000139", name: "Nala", breed: "Mixed breed", age: "About 1 year", sex: "Female", size: "Medium", location: "Warakapola area", status: "Ready for adoption", image: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1200&q=85", updates: 8, lastSeen: "2 days ago", featured: true },
  { code: "PP-000136", name: "Kavi", breed: "Sri Lankan village mix", age: "About 4 years", sex: "Male", size: "Large", location: "Nelundeniya area", status: "Receiving treatment", image: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=1200&q=85", updates: 17, lastSeen: "Today", featured: true },
  { code: "PP-000131", name: "Poppy", breed: "Mixed breed", age: "Under 1 year", sex: "Female", size: "Small", location: "Tholangamuwa area", status: "In community care", image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=85", updates: 5, lastSeen: "3 days ago" },
  { code: "PP-000128", name: "Ravi", breed: "Mixed breed", age: "About 6 years", sex: "Male", size: "Medium", location: "Galapitamada area", status: "In community care", image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=1200&q=85", updates: 21, lastSeen: "Yesterday" },
  { code: "PP-000124", name: "Coco", breed: "Sri Lankan village mix", age: "About 3 years", sex: "Female", size: "Medium", location: "Yatiyanthota area", status: "Ready for adoption", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=85", updates: 9, lastSeen: "4 days ago" }
];

export const events = [
  { type: "Health observation", title: "Wound healing well", date: "5 Nov 2026, 4:20 PM", author: "Nimali Perera", detail: "The wound on the left front leg appears clean and dry. Milo is walking comfortably. This is an observation, not a veterinary diagnosis." },
  { type: "Feeding", title: "Evening meal and fresh water", date: "3 Nov 2026, 5:45 PM", author: "Kasun Silva", detail: "Dry food and clean water provided near the usual care point." },
  { type: "Veterinary visit", title: "Follow-up examination", date: "30 Oct 2026, 10:15 AM", author: "Nimali Perera", detail: "Reviewed by a veterinary professional. Continue wound care and return if swelling increases." },
  { type: "Discovery", title: "First recorded near Tholangamuwa", date: "24 Oct 2026, 8:30 AM", author: "Sahan Fernando", detail: "Friendly pup found near a local road. Two community members were present." }
];
