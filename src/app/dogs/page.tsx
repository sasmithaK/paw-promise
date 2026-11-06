import { DogDirectory } from "@/components/dogs/dog-directory";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export const metadata = { title: "Paw directory" };

export default function DogsPage() {
  return <><PublicHeader/><main className="container-shell min-w-0 py-10 sm:py-14 lg:py-16"><p className="eyebrow">Community paw directory</p><div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end"><h1 className="page-title max-w-3xl text-balance">Every paw has a story still being written.</h1><p className="body-lg max-w-xl">Meet the pups, explore their published profiles, and follow the care histories our community has recorded.</p></div><div className="mt-8 sm:mt-10"><DogDirectory/></div></main><PublicFooter/></>;
}
