import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DonationBatch, Shelter, Rider, HandoffPoint, DeliveryTask } from '../../types';
import { ShieldCheck, MapPin, Navigation, AlertTriangle, Truck, Clock, RefreshCw } from 'lucide-react';

interface Props {
  batches: DonationBatch[];
  shelters: Shelter[];
  riders: Rider[];
  handoffPoints: HandoffPoint[];
  tasks: DeliveryTask[];
  onSelectEntity?: (type: 'batch' | 'shelter' | 'rider' | 'task', entity: any) => void;
  selectedTaskId?: string;
}

export const LiveOperationsMap: React.FC<Props> = ({
  batches,
  shelters,
  riders,
  handoffPoints,
  tasks,
  onSelectEntity,
  selectedTaskId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'tasks' | 'shelters' | 'riders'>('all');
  const [selectedEntityInfo, setSelectedEntityInfo] = useState<{ title: string; subtitle: string; details: string; type: string } | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet Map centered on Pune, Maharashtra
    const map = L.map(mapContainerRef.current, {
      center: [18.5250, 73.8650],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

  
    // No-key OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);


    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and polylines whenever data or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const routesGroup = routesLayerRef.current;
    if (!map || !markersGroup || !routesGroup) return;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    // Helper: Create custom SVG HTML icon
    const createCustomIcon = (bgColor: string, textOrIcon: string, borderColor: string = '#ffffff') => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${bgColor};
            border: 2px solid ${borderColor};
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            color: #ffffff;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${textOrIcon}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });
    };

    // 1. Plot Donors / Batches
    if (activeFilter === 'all') {
      batches.forEach(b => {
        const isEligible = b.eligibilityStatus === 'ELIGIBLE_FOR_MATCHING';
        const color = isEligible ? '#0D9488' : b.eligibilityStatus === 'REVIEW_REQUIRED' ? '#8B5CF6' : '#EF4444';
        const marker = L.marker([b.pickupLocation.lat, b.pickupLocation.lng], {
          icon: createCustomIcon(color, '🍲', '#CCFBF1')
        });

        marker.bindPopup(`
          <div style="min-width: 200px; font-family: system-ui, sans-serif; font-size: 13px; color: #1e293b;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${b.donorName}</div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${b.pickupLocation.areaName}</div>
            <div style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background-color: ${isEligible ? '#ecfdf5' : '#fef2f2'}; color: ${isEligible ? '#065f46' : '#991b1b'}; margin-bottom: 6px;">
              ${b.eligibilityStatus.replace(/_/g, ' ')}
            </div>
            <div style="font-size: 12px; margin-bottom: 2px;"><strong>Quantity:</strong> ${b.totalQuantity} ${b.unit}</div>
            <div style="font-size: 12px; margin-bottom: 4px;"><strong>Storage:</strong> ${b.storageMethod} (${b.temperatureRecorded ? b.temperatureRecorded + '°C' : 'N/A'})</div>
            <div style="font-size: 11px; color: #475569;">Recorded Deadline: ${new Date(b.recordedDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedEntityInfo({
            type: 'Donation Batch',
            title: b.donorName,
            subtitle: `${b.totalQuantity} ${b.unit} • ${b.pickupLocation.areaName}`,
            details: `Status: ${b.eligibilityStatus} | Packaging: ${b.packaging} | Temp: ${b.temperatureRecorded || 'N/A'}°C`
          });
          if (onSelectEntity) onSelectEntity('batch', b);
        });

        markersGroup.addLayer(marker);
      });
    }

    // 2. Plot Shelters
    if (activeFilter === 'all' || activeFilter === 'shelters') {
      shelters.forEach(s => {
        const isOpen = s.openStatus === 'open';
        const color = isOpen ? '#1E40AF' : '#64748B';
        const iconSymbol = isOpen ? '🏢' : '🔒';
        const marker = L.marker([s.location.lat, s.location.lng], {
          icon: createCustomIcon(color, iconSymbol, isOpen ? '#93C5FD' : '#CBD5E1')
        });

        marker.bindPopup(`
          <div style="min-width: 220px; font-family: system-ui, sans-serif; font-size: 13px; color: #1e293b;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${s.name}</div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${s.location.areaName}</div>
            <div style="margin-bottom: 6px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background-color: ${isOpen ? '#eff6ff' : '#f1f5f9'}; color: ${isOpen ? '#1e40af' : '#475569'};">
                ${s.openStatus.toUpperCase()}
              </span>
              <span style="font-size: 11px; color: #64748b; margin-left: 6px;">Cap: ${s.receivingCapacity} units</span>
            </div>
            <div style="font-size: 11px; color: #334155;">
              Clean Water: <strong>${s.facilities.waterAvailable ? '✓ Available' : '✗ Unavailable'}</strong><br/>
              Cooking Fuel: <strong>${s.facilities.cookingFuelAvailable ? '✓ Available' : '✗ Unavailable'}</strong><br/>
              Cold Storage: <strong>${s.facilities.coldStorageAvailable ? '✓ Available' : '✗ None'}</strong>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedEntityInfo({
            type: 'Receiving Shelter',
            title: s.name,
            subtitle: `${s.location.areaName} • Status: ${s.openStatus}`,
            details: `Capacity: ${s.receivingCapacity} | Water: ${s.facilities.waterAvailable ? 'Yes' : 'No'} | Fuel: ${s.facilities.cookingFuelAvailable ? 'Yes' : 'No'}`
          });
          if (onSelectEntity) onSelectEntity('shelter', s);
        });

        markersGroup.addLayer(marker);
      });
    }

    // 3. Plot Riders
    if (activeFilter === 'all' || activeFilter === 'riders') {
      riders.forEach(r => {
        const isFree = r.isOnline && r.isAvailable && r.currentAssignedQty === 0;
        const color = isFree ? '#10B981' : r.isOnline ? '#F59E0B' : '#94A3B8';
        const marker = L.marker([r.location.lat, r.location.lng], {
          icon: createCustomIcon(color, '🏍️', '#FEF3C7')
        });

        marker.bindPopup(`
          <div style="min-width: 190px; font-family: system-ui, sans-serif; font-size: 13px; color: #1e293b;">
            <div style="font-weight: 700; color: #0f172a;">${r.name}</div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${r.location.areaName}</div>
            <div style="font-size: 12px; margin-bottom: 3px;">
              <strong>Carrying Load:</strong> ${r.currentAssignedQty} / ${r.maxCapacity} meals
            </div>
            <div style="font-size: 11px; color: #475569;">
              Response Rate: ${r.acceptanceRate}% • Completed: ${r.completedDeliveries}
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedEntityInfo({
            type: 'Volunteer Rider',
            title: r.name,
            subtitle: `${r.vehicleType.toUpperCase()} • ${r.location.areaName}`,
            details: `Capacity: ${r.currentAssignedQty}/${r.maxCapacity} meals | Status: ${r.isOnline ? 'Online' : 'Offline'}`
          });
          if (onSelectEntity) onSelectEntity('rider', r);
        });

        markersGroup.addLayer(marker);
      });
    }

    // 4. Plot Safe Handoff Points
    if (activeFilter === 'all') {
      handoffPoints.forEach(hp => {
        const marker = L.marker([hp.location.lat, hp.location.lng], {
          icon: createCustomIcon('#06B6D4', '🔄', '#CFFAFE')
        });

        marker.bindPopup(`
          <div style="min-width: 200px; font-family: system-ui, sans-serif; font-size: 13px; color: #1e293b;">
            <div style="font-weight: 700; color: #0f172a;">${hp.name}</div>
            <div style="color: #0891b2; font-size: 11px; font-weight: 600; margin-bottom: 4px;">VERIFIED SAFE HANDOFF HUB</div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${hp.location.areaName}</div>
            <div style="font-size: 12px;"><strong>Capacity:</strong> ${hp.currentOccupancy}/${hp.capacity} units</div>
            <div style="font-size: 11px; color: #475569;">Cold storage: ${hp.coldStorageAvailable ? 'Available' : 'No'}</div>
          </div>
        `);

        markersGroup.addLayer(marker);
      });
    }

    // 5. Draw Active Delivery Polylines & Routes
    tasks.forEach(t => {
      const isSelected = selectedTaskId === t.id;
      const isDelivered = t.status === 'delivered';
      const isEscalated = t.status === 'escalated';
      const isReassigned = t.reassignmentHistory.length > 0;

      let routeColor = '#14B8A6'; // teal for active normal
      if (isDelivered) routeColor = '#10B981';
      else if (isEscalated) routeColor = '#EF4444';
      else if (isReassigned) routeColor = '#F59E0B'; // amber for rerouted / reassigned

      // If reassigned, draw dashed line to original shelter if found
      if (isReassigned && t.reassignmentHistory[0]?.previousShelterId) {
        const prevShelter = shelters.find(s => s.id === t.reassignmentHistory[0].previousShelterId);
        if (prevShelter) {
          const originalLine = L.polyline(
            [
              [t.pickupLocation.lat, t.pickupLocation.lng],
              [prevShelter.location.lat, prevShelter.location.lng]
            ],
            {
              color: '#94A3B8',
              weight: 2,
              dashArray: '6, 6',
              opacity: 0.5
            }
          );
          originalLine.bindPopup(`
            <div style="font-family: system-ui, sans-serif; font-size: 11px; color: #475569;">
              <strong>Original Route (Disrupted):</strong> To ${prevShelter.name}<br/>
              <em>Rerouted autonomously to ${t.shelterName}</em>
            </div>
          `);
          routesGroup.addLayer(originalLine);
        }
      }

      const polyline = L.polyline(
        [
          [t.pickupLocation.lat, t.pickupLocation.lng],
          [t.dropoffLocation.lat, t.dropoffLocation.lng]
        ],
        {
          color: routeColor,
          weight: isSelected ? 5 : 3.5,
          dashArray: isDelivered ? '4, 8' : '0',
          opacity: isSelected ? 0.95 : 0.85
        }
      );

      polyline.bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #1e293b;">
          <strong>Task ${t.id.slice(-6)}: ${t.allocatedQty} ${t.unit}</strong><br/>
          <strong>Rider:</strong> ${t.riderName}<br/>
          <strong>Destination:</strong> ${t.shelterName}<br/>
          <strong>Simulated Travel Time:</strong> ~${t.estimatedTravelMinutes} mins<br/>
          <strong>ETA Buffer:</strong> ${t.deadlineBufferMinutes}m slack<br/>
          <strong>Status:</strong> ${t.status.toUpperCase()}
          ${isReassigned ? '<div style="color: #d97706; font-weight: 600; margin-top: 4px;">⚡ Rerouted to Alternate Destination</div>' : ''}
          <div style="font-size: 10px; color: #64748b; margin-top: 4px; border-top: 1px solid #e2e8f0; pt-1;">
            *Approximate straight-line corridor estimate. Not live GPS.
          </div>
        </div>
      `);

      routesGroup.addLayer(polyline);
    });
  }, [batches, shelters, riders, handoffPoints, tasks, activeFilter, selectedTaskId]);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl flex flex-col">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-2 items-center bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/80 shadow-lg text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-teal-400" /> Pune Aid Grid
        </span>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex gap-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded transition ${activeFilter === 'all' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            All ({batches.length + shelters.length + riders.length})
          </button>
          <button
            onClick={() => setActiveFilter('shelters')}
            className={`px-2.5 py-1 rounded transition ${activeFilter === 'shelters' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Shelters ({shelters.length})
          </button>
          <button
            onClick={() => setActiveFilter('riders')}
            className={`px-2.5 py-1 rounded transition ${activeFilter === 'riders' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Riders ({riders.length})
          </button>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <span className="text-[11px] text-slate-400 italic">
          Simulated transit & approximate distance model
        </span>
      </div>

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Selected Entity Inspector Tray */}
      {selectedEntityInfo && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-semibold text-teal-400">{selectedEntityInfo.type}</span>
                <h4 className="text-sm font-bold text-slate-100">{selectedEntityInfo.title}</h4>
              </div>
              <p className="text-xs text-slate-300">{selectedEntityInfo.subtitle}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedEntityInfo.details}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedEntityInfo(null)}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded border border-slate-700"
          >
            Close
          </button>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-lg text-[11px] space-y-1 shadow-md hidden sm:block">
        <div className="font-semibold text-slate-200 mb-1 border-b border-slate-700 pb-0.5">Map Legend</div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-teal-600 border border-teal-300"></span> Donor Pickup
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-blue-700 border border-blue-400"></span> Receiving Shelter
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-200"></span> Volunteer Rider (Max 40)
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-200"></span> Relay Handoff Hub
        </div>
      </div>
    </div>
  );
};
