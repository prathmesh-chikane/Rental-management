"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationMapPickerProps {
  locationValue: string;
  landmarkValue?: string;
  onLocationSelect: (location: string, landmark?: string) => void;
}

export default function LocationMapPicker({
  locationValue,
  landmarkValue = "",
  onLocationSelect,
}: LocationMapPickerProps) {
  const [query, setQuery] = useState(locationValue || "");
  const [mapLinkInput, setMapLinkInput] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "link">("search");
  const [isSearching, setIsSearching] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [customIframeUrl, setCustomIframeUrl] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({
    lat: 19.0330,
    lng: 73.0297,
  });
  const [markerAddress, setMarkerAddress] = useState(locationValue || "Navi Mumbai, Maharashtra, India");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync initial query if locationValue changes from outside
  useEffect(() => {
    if (locationValue && locationValue !== query) {
      setQuery(locationValue);
    }
  }, [locationValue]);

  // Geocode address via OpenStreetMap Nominatim
  const searchAddress = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setLinkError("");
    setCustomIframeUrl(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newCoords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
        setMapCoords(newCoords);
        setMarkerAddress(item.display_name);
        onLocationSelect(searchQuery, landmarkValue);
      } else {
        setLinkError("Location not found on map. Please try a nearby area or city.");
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsSearching(false);
    }
  };

  // Helper to extract coords or query from a full (unshortened) URL
  const extractFromUrl = async (fullUrl: string): Promise<boolean> => {
    // 1. Check if user pasted an embed iframe code e.g. <iframe src="..." ...>
    const iframeSrcMatch = fullUrl.match(/src=["'](.*?)["']/);
    if (iframeSrcMatch && iframeSrcMatch[1]) {
      setCustomIframeUrl(iframeSrcMatch[1]);
      setMarkerAddress("Custom Map Embed Location");
      return true;
    }

    // 2. Check for !3d<lat>!4d<lng> (Standard Google Maps Place/Search URLs)
    // Example: https://www.google.com/maps/place/.../data=...!3d18.5204303!4d73.8567437
    const proto3d4dMatch = fullUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (proto3d4dMatch) {
      const lat = parseFloat(proto3d4dMatch[1]);
      const lng = parseFloat(proto3d4dMatch[2]);
      setMapCoords({ lat, lng });
      setCustomIframeUrl(null);
      await reverseGeocode(lat, lng);
      return true;
    }

    // 3. Check for @lat,lng in Google Maps URL e.g. https://www.google.com/maps/@18.5204,73.8567,15z
    const coordsMatch = fullUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[2]);
      setMapCoords({ lat, lng });
      setCustomIframeUrl(null);
      await reverseGeocode(lat, lng);
      return true;
    }

    // 4. Check for query parameter q=lat,lng or ll=lat,lng
    const queryCoordsMatch = fullUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryCoordsMatch) {
      const lat = parseFloat(queryCoordsMatch[1]);
      const lng = parseFloat(queryCoordsMatch[2]);
      setMapCoords({ lat, lng });
      setCustomIframeUrl(null);
      await reverseGeocode(lat, lng);
      return true;
    }

    // 5. Check for place name in URL: /place/Koregaon+Park+Pune/ or /place/Name/@...
    const placeMatch = fullUrl.match(/\/place\/([^/@?]+)/);
    if (placeMatch && placeMatch[1]) {
      const decodedPlace = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      setQuery(decodedPlace);
      await searchAddress(decodedPlace);
      return true;
    }

    // 6. Check search parameters: ?q=Place+Name
    try {
      const urlObj = new URL(fullUrl);
      const q = urlObj.searchParams.get("q") || urlObj.searchParams.get("query");
      if (q) {
        setQuery(q);
        await searchAddress(q);
        return true;
      }
    } catch {
      // not a standard URL
    }

    return false;
  };

  // Parse Google Maps or OpenStreetMap link (including short links like maps.app.goo.gl)
  const handleApplyMapLink = async () => {
    let rawLink = mapLinkInput.trim();
    if (!rawLink) return;

    setIsSearching(true);
    setLinkError("");

    // If it's a short URL (maps.app.goo.gl or goo.gl/maps), resolve it via our API route
    if (rawLink.includes("goo.gl") || rawLink.includes("maps.app")) {
      try {
        const res = await fetch("/api/resolve-map-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: rawLink }),
        });
        const data = await res.json();
        if (data && data.resolvedUrl) {
          rawLink = data.resolvedUrl;
        }
      } catch {
        // Continue with original link if resolution fails
      }
    }

    const success = await extractFromUrl(rawLink);
    setIsSearching(false);

    if (!success) {
      setLinkError(
        "Could not detect location from this link. Try pasting the full browser URL, or search by name above.",
      );
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(", ");
        const shortLoc = parts.slice(0, 3).join(", ");
        const landmark = data.address?.suburb || data.address?.neighbourhood || "";
        setQuery(shortLoc);
        setMarkerAddress(data.display_name);
        onLocationSelect(shortLoc, landmark);
      }
    } catch {
      // ignore
    }
  };

  // Get User's Current GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsSearching(true);
    setLinkError("");
    setCustomIframeUrl(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCoords(coords);
        await reverseGeocode(coords.lat, coords.lng);
        setIsSearching(false);
      },
      () => {
        setIsSearching(false);
        alert("Could not detect location. Please type manually or paste a link.");
      },
    );
  };

  const osmEmbedUrl =
    customIframeUrl ||
    `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng - 0.01}%2C${mapCoords.lat - 0.008}%2C${mapCoords.lng + 0.01}%2C${mapCoords.lat + 0.008}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lng}`;

  return (
    <div className="space-y-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700">
            <MapPin className="h-3.5 w-3.5" /> Interactive Location Map
          </span>
          <div className="flex rounded-lg border border-indigo-200 bg-white p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("search");
                setLinkError("");
              }}
              className={`rounded-md px-2 py-0.5 transition-colors ${activeTab === "search" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-indigo-600"
                }`}
            >
              Search Name
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("link");
                setLinkError("");
              }}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-colors ${activeTab === "link" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-indigo-600"
                }`}
            >
              <Link2 className="h-3 w-3" /> Paste Map Link
            </button>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleGetCurrentLocation}
          className="h-7 gap-1 border-indigo-200 bg-white px-2.5 text-[11px] font-bold text-indigo-700 shadow-2xs hover:bg-indigo-50"
        >
          <LocateFixed className="h-3 w-3" /> GPS
        </Button>
      </div>

      {/* Tab 1: Search Address */}
      {activeTab === "search" && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchAddress(query);
                }
              }}
              placeholder="Search area, road, or city name..."
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => searchAddress(query)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => searchAddress(query)}
            disabled={isSearching}
            className="h-9 bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700"
          >
            {isSearching ? "Searching..." : "Locate"}
          </Button>
        </div>
      )}

      {/* Tab 2: Paste Map Link */}
      {activeTab === "link" && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={mapLinkInput}
                onChange={(e) => setMapLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyMapLink();
                  }
                }}
                placeholder="Paste Google Maps link (e.g. https://maps.app.goo.gl/... or google.com/maps/place/...)"
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyMapLink}
              disabled={isSearching}
              className="h-9 bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700"
            >
              {isSearching ? "Resolving..." : "Apply Link"}
            </Button>
          </div>
          <p className="text-[11px] text-slate-500">
            Supports: Google Maps app share links (`maps.app.goo.gl`), browser links (`google.com/maps/place/...`), or embed `&lt;iframe&gt;` tags.
          </p>
        </div>
      )}

      {/* Error Message */}
      {linkError && (
        <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
          ⚠️ {linkError}
        </p>
      )}

      {/* Live Map Preview */}
      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-300 shadow-inner bg-slate-100">
        <iframe
          ref={iframeRef}
          title="Property Location Map"
          src={osmEmbedUrl}
          className="h-full w-full border-0"
          loading="lazy"
        />
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 right-1.5 rounded-lg bg-white/90 px-2 py-1 backdrop-blur-xs text-[10px] font-medium text-slate-700 truncate shadow-xs">
          📍 {markerAddress}
        </div>
      </div>
    </div>
  );
}
