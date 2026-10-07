"use client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}) {
 return <main className="max-w-xl mx-auto p-12 text-center"><h1 className="text-2xl font-bold">We could not load this page</h1><p className="my-4">Please retry. If the issue continues, check that the local backend is running.</p><button className="bg-black text-white px-6 py-3 rounded" onClick={reset}>Try again</button></main>;
}
