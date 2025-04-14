'use client';

import React, { useEffect, useRef } from 'react';

const GeofencingMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20.6843, lng: -103.3167 }, // Clinica 14 del IMSS
        zoom: 12,
      });

      // Restaurant Location
      const restaurantLocation = { lat: 20.6843, lng: -103.3167 };

      // Add a marker for the restaurant
      new window.google.maps.Marker({
        position: restaurantLocation,
        map: map,
        title: "CasaNala Restaurant",
      });

      // Add a circle for the geofence (10 km radius)
      const geofence = new window.google.maps.Circle({
        center: restaurantLocation,
        radius: 10000, // 10 km in meters
        fillColor: '#FF0000',
        fillOpacity: 0.1,
        strokeColor: '#FF0000',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        map: map,
      });
    };

    if (typeof window.google !== 'undefined') {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=&callback=initMap`;
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    }

    return () => {
      delete (window as any).initMap;
    };
  }, []);

  return (
    <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
  );
};

export default GeofencingMap;

