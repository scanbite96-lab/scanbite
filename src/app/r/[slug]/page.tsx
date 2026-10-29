"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Restaurant } from "@/types";
import { 
  UtensilsCrossed, 
  MapPin, 
  Phone, 
  ArrowRight, 
  ShoppingBag, 
  Sparkles,
  ChevronRight,
  Clock
} from "lucide-react";

export default function RestaurantLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-orange-50/50">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium text-sm">Loading restaurant...</p>
        </div>
      }
    >
      <RestaurantLandingContent />
    </Suspense>
  );
}

function RestaurantLandingContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const tableQuery = searchParams.get("table") || searchParams.get("t");

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch(`/api/restaurants?slug=${slug}`);
        if (!res.ok) throw new Error("Restaurant not found");
        const data: Restaurant = await res.json();
        setRestaurant(data);

        // If table query parameter exists, auto-redirect to that table
        if (tableQuery) {
          const matched = data.tables.find(
            (t) =>
              t.id.toLowerCase() === tableQuery.toLowerCase() ||
              t.tableNumber.toLowerCase().includes(tableQuery.toLowerCase())
          );
          const targetId = matched ? matched.id : tableQuery;
          router.replace(`/r/${slug}/t/${targetId}`);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load restaurant");
        }
      } finally {
        setLoading(false);
      }
    }
    loadRestaurant();
  }, [slug, tableQuery, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-orange-50/50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Loading restaurant menu...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <UtensilsCrossed className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Restaurant Unavailable</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">
          {error || "Could not find this restaurant. Please verify the URL or ask the restaurant staff."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <span>Return to ScanBite Home</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (restaurant.isActive === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Service Temporarily Paused</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">
          {restaurant.name} has temporarily paused online digital ordering. Please ask the restaurant staff for assistance.
        </p>
      </div>
    );
  }

  const defaultTable = restaurant.tables[0] || { id: "tbl-1", tableNumber: "Table 1" };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <main className="max-w-md mx-auto w-full px-4 pt-8 pb-12">
        {/* Restaurant Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 text-center relative overflow-hidden mb-6">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500" />
          
          <div className="w-20 h-20 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner mb-4 border border-orange-100">
            <UtensilsCrossed className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{restaurant.name}</h1>
          {restaurant.tagline && (
            <p className="text-xs text-orange-600 font-semibold mt-1">{restaurant.tagline}</p>
          )}

          <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            {restaurant.address && (
              <div className="flex items-center justify-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{restaurant.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-5">
            <Link
              href={`/r/${slug}/t/${defaultTable.id}`}
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 active:scale-98 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Digital Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Table Selector */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Select Your Table</h2>
              <p className="text-xs text-slate-400">Ordering dine-in? Choose your table number</p>
            </div>
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {restaurant.tables.map((table) => (
              <Link
                key={table.id}
                href={`/r/${slug}/t/${table.id}`}
                className="py-3 px-2 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50 text-center transition group active:scale-95"
              >
                <span className="block text-xs font-bold text-slate-800 group-hover:text-orange-600">
                  {table.tableNumber}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  {table.seats ? `${table.seats} seats` : "Dine In"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Powered by <strong className="text-orange-600">ScanBite</strong> Digital QR System
      </footer>
    </div>
  );
}
