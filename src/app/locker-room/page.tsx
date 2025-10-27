
"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { storeProducts, Product } from "@/lib/storeData";
import { ShoppingCart } from "lucide-react";

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="bg-card rounded-card border border-white/10 overflow-hidden flex flex-col">
      <div className="relative h-48 w-full">
        <Image 
            src={product.imageUrl} 
            alt={product.name} 
            fill 
            style={{ objectFit: 'cover' }}
            data-ai-hint={product.imageHint}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg font-headline text-white">{product.name}</h3>
        <p className="text-sm text-white/60 flex-1">{product.description}</p>
        <div className="flex justify-between items-center mt-4">
            <p className="text-xl font-bold text-gold font-headline">{product.price}</p>
            <Link href={product.amazonUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary">
                <ShoppingCart size={16} /> View on Amazon
              </Button>
            </Link>
        </div>
      </div>
    </div>
  );
};


export default function LockerRoomPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Locker Room" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-headline tracking-tight">The Official M2DG Store</h2>
            <p className="text-sm text-white/50">Gear up with the best equipment, sourced and recommended by our community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
