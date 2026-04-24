"use client";
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { Client, Deal } from '../store';
import 'leaflet/dist/leaflet.css';

interface Props {
  clients: Client[];
  deals: Deal[];
}

// Demo coordinates mapped to company names
const COMPANY_COORDS: Record<string, [number, number]> = {
  'Good Place Inc.': [40.7128, -74.006],      // New York
  'Dunder Mifflin': [41.4086, -75.6621],       // Scranton, PA
  'Pawnee Parks': [40.0583, -86.4006],          // Pawnee (Indiana)
  'Very Good Building': [41.8781, -87.6298],    // Chicago
  'Acme Corp': [34.0522, -118.2437],            // Los Angeles
  'Global Tech': [37.7749, -122.4194],          // San Francisco
  'Stark Ind.': [25.7617, -80.1918],            // Miami
  'Wayne Ent.': [42.3314, -83.0458],            // Detroit (Gotham)
  'Oscorp': [40.7484, -73.9857],                // NYC (Midtown)
  'Umbrella Corp': [48.8566, 2.3522],           // Paris
  'Cyberdyne': [35.6762, 139.6503],             // Tokyo
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export function ClientMap({ clients, deals }: Props) {
  // Calculate revenue per client/company
  const clientRevenueData = useMemo(() => {
    const revenueMap: Record<string, { client: Client; coords: [number, number]; revenue: number; dealCount: number }> = {};

    clients.forEach(c => {
      const coords = COMPANY_COORDS[c.company] || [
        20 + Math.random() * 40,
        -120 + Math.random() * 100
      ];

      // Find deals related to this client (fuzzy match on company first word)
      const keyword = c.company.split(' ')[0].toLowerCase();
      const clientDeals = deals.filter(d => d.client.toLowerCase().includes(keyword));
      const totalRevenue = clientDeals.reduce((sum, d) => sum + d.value, 0);

      revenueMap[c.company] = {
        client: c,
        coords,
        revenue: totalRevenue || Math.floor(Math.random() * 50000) + 5000, // fallback demo value
        dealCount: clientDeals.length || 1,
      };
    });

    // Also add deals that don't match any client
    deals.forEach(d => {
      if (!Object.values(revenueMap).some(r => d.client.toLowerCase().includes(r.client.company.split(' ')[0].toLowerCase()))) {
        const coords = COMPANY_COORDS[d.client] || [
          30 + Math.random() * 30,
          -100 + Math.random() * 80
        ];
        if (!revenueMap[d.client]) {
          revenueMap[d.client] = {
            client: { id: 0, name: d.client, company: d.client, email: '', status: 'Active' as const },
            coords,
            revenue: d.value,
            dealCount: 1,
          };
        }
      }
    });

    return Object.values(revenueMap);
  }, [clients, deals]);

  const maxRevenue = Math.max(...clientRevenueData.map(d => d.revenue), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-white">Client Revenue Map</h1>
          <p className="text-xs text-gray-500 mt-1">Geographic distribution of client revenue</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-purple-300">{clientRevenueData.length} locations</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]" style={{ height: '500px' }}>
        <MapContainer
          center={[35, -30]}
          zoom={2}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#0a0a0c' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {clientRevenueData.map((data, i) => {
            const normalizedRevenue = data.revenue / maxRevenue;
            const radius = 8 + normalizedRevenue * 25;
            const opacity = 0.4 + normalizedRevenue * 0.5;

            return (
              <CircleMarker
                key={i}
                center={data.coords}
                radius={radius}
                fillColor="#7663b0"
                fillOpacity={opacity}
                color="#7c3aed"
                weight={1.5}
                opacity={0.8}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  className="custom-tooltip"
                >
                  <div style={{
                    background: '#0c0c0e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: '12px',
                    minWidth: '150px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: '#7663b0' }}>
                      {data.client.name || data.client.company}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '6px' }}>
                      {data.client.company}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ color: '#6b7280' }}>Revenue</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(data.revenue)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ color: '#6b7280' }}>Deals</span>
                      <span style={{ fontWeight: 500 }}>{data.dealCount}</span>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4">
        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Revenue Scale</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500/40" />
          <span className="text-[10px] text-gray-500">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-500/60 border border-purple-500/60" />
          <span className="text-[10px] text-gray-500">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-500/90 border border-purple-500/80" />
          <span className="text-[10px] text-gray-500">High</span>
        </div>
      </div>

      {/* Custom tooltip override */}
      <style>{`
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip::before {
          display: none !important;
        }
        .leaflet-container {
          background: #0a0a0c !important;
        }
      `}</style>
    </motion.div>
  );
}
