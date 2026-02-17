"use client";

import Image from "next/image";
import { useState } from "react";

type ReviewPhoto = { id: string; image: string; reviewerName: string; rating: number; content: string };

export default function ReviewPhotoGallery({ photos }: { photos: ReviewPhoto[] }) {
  const [idx, setIdx] = useState<number | null>(null);

  return (
    <section>
      <p className="font-semibold">📸 포토 리뷰 ({photos.length})</p>
      <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => setIdx(i)} className="shrink-0">
            <Image src={p.image} alt={p.reviewerName} width={64} height={64} className="w-16 h-16 rounded object-cover" />
          </button>
        ))}
      </div>
      {idx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 text-white p-4 flex flex-col justify-center items-center">
          <button className="absolute top-4 right-4" onClick={() => setIdx(null)}>✕</button>
          <Image src={photos[idx].image} alt={photos[idx].reviewerName} width={520} height={520} className="max-h-[70vh] object-contain" />
          <p className="mt-3 text-sm">{photos[idx].reviewerName} · {"★".repeat(photos[idx].rating)}</p>
          <p className="text-sm text-slate-200">{photos[idx].content}</p>
          <div className="mt-2 flex gap-2">
            <button disabled={idx===0} onClick={() => setIdx((v)=> (v===null?0:Math.max(0,v-1)))}>이전</button>
            <button disabled={idx===photos.length-1} onClick={() => setIdx((v)=> (v===null?0:Math.min(photos.length-1,v+1)))}>다음</button>
          </div>
        </div>
      )}
    </section>
  );
}
