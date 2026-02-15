"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (el: HTMLElement, opts: { center: unknown; zoom: number }) => {
          setCenter: (latLng: unknown) => void;
        };
        LatLng: new (lat: number, lng: number) => unknown;
        Marker: new (opts: { map: unknown; position: unknown }) => unknown;
        Service?: {
          geocode: (
            opts: { query: string },
            cb: (status: string, response: { v2?: { addresses?: Array<{ x: string; y: string }> } }) => void,
          ) => void;
          Status: { OK: string };
        };
      };
    };
  }
}

type Props = {
  queryAddress?: string;
};

export default function NaverMap({ queryAddress }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const scriptId = "naver-map-sdk";

    const initMap = () => {
      if (!window.naver || !mapRef.current) return;

      const naver = window.naver;
      const map = new naver.maps.Map(mapRef.current, {
        center: new naver.maps.LatLng(35.5384, 129.3114),
        zoom: 14,
      });

      if (queryAddress && naver.maps.Service) {
        naver.maps.Service.geocode({ query: queryAddress }, (status, response) => {
          if (status !== naver.maps.Service?.Status.OK) return;
          const item = response?.v2?.addresses?.[0];
          if (!item) return;

          const lat = Number(item.y);
          const lng = Number(item.x);
          const point = new naver.maps.LatLng(lat, lng);
          map.setCenter(point);
          new naver.maps.Marker({ map, position: point });
        });
      }
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      if (window.naver) initMap();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = initMap;
    script.onerror = () => setLoadError("네이버 지도 SDK를 불러오지 못했습니다.");
    document.head.appendChild(script);
  }, [clientId, queryAddress]);

  if (!clientId) {
    return <p style={{ color: "#b91c1c", marginTop: 8 }}>NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.</p>;
  }

  if (loadError) {
    return <p style={{ color: "#b91c1c", marginTop: 8 }}>{loadError}</p>;
  }

  return <div ref={mapRef} style={{ width: "100%", height: 280, borderRadius: 14, border: "1px solid #e2e8f0" }} />;
}
