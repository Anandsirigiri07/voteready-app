import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../LanguageContext';

// Fix leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function BoothScreen() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [center, setCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center
  const [zoom, setZoom] = useState(4);
  const [booths, setBooths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const useGPS = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserLoc([lat, lon]);
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        const areaName = data.address?.postcode || data.address?.suburb || data.address?.city || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setQuery(areaName);
        searchBooths(lat, lon);
      } catch (err) {
        setIsLoading(false);
        setError('Failed to get location name.');
      }
    }, () => {
      setIsLoading(false);
      setError('Failed to get your GPS location. Please check your permissions.');
    });
  };

  const searchBooths = async (lat: number, lon: number) => {
    setCenter([lat, lon]);
    setZoom(14);
    setError('');
    setBooths([]);

    try {
      const query1 = `[out:json];(node["amenity"="polling_station"](around:5000,${lat},${lon}););out body;>;out skel qt;`;
      const res1 = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query1 });
      const data1 = await res1.json();
      
      let foundBooths = data1.elements.filter((e: any) => e.tags && e.tags.name);

      if (foundBooths.length === 0) {
        const query2 = `[out:json];(node["amenity"="school"](around:3000,${lat},${lon});node["amenity"="community_centre"](around:3000,${lat},${lon}););out body;>;out skel qt;`;
        const res2 = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query2 });
        const data2 = await res2.json();
        foundBooths = data2.elements.filter((e: any) => e.tags && e.tags.name);
      }

      const finalBooths = foundBooths.slice(0, 5).map((e: any) => ({
        id: e.id,
        name: e.tags.name,
        lat: e.lat,
        lon: e.lon,
      }));

      if (finalBooths.length === 0) {
        setError(
          <span>
            No polling booths found near this area. Try a nearby pincode or visit <a href="https://voters.eci.gov.in" target="_blank" rel="noreferrer" className="text-primary underline font-semibold">voters.eci.gov.in</a> to find your official booth.
          </span>
        );
      } else {
        setBooths(finalBooths);
      }
    } catch (err) {
      setError('An error occurred while searching for booths.');
    } finally {
      setIsLoading(false);
    }
  };

  const searchArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsLoading(true);
    setError('');

    try {
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}`);
      const nomData = await nomRes.json();
      
      if (nomData.length === 0) {
        setError('Location not found. Try a different area or pincode.');
        setIsLoading(false);
        return;
      }
      
      const lat = parseFloat(nomData[0].lat);
      const lon = parseFloat(nomData[0].lon);
      await searchBooths(lat, lon);
    } catch (err) {
      setError('An error occurred while geocoding the address.');
      setIsLoading(false);
    }
  };

  const navigateToBooth = (boothLat: number, boothLon: number) => {
    if (userLoc) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLoc[0]},${userLoc[1]}&destination=${boothLat},${boothLon}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${boothLat},${boothLon}`, '_blank');
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-lg mb-2">{t('booth.title')}</h2>
        <form onSubmit={searchArea} className="flex gap-2 mb-2">
          <input 
            type="text" 
            placeholder={t('booth.placeholder')}
            aria-label={t('booth.placeholder')}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={isLoading} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center min-w-[80px]">
            {isLoading ? <Loader2 className="animate-spin w-4 h-4" aria-label={t('booth.searching')} /> : t('booth.search')}
          </button>
        </form>
        <button 
          type="button" 
          onClick={useGPS} 
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" aria-hidden="true" />
          {t('booth.gps')}
        </button>
        {error && <p className="text-red-500 text-sm mt-3 bg-red-50 p-2 rounded-lg border border-red-100" role="alert">{error}</p>}
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex-1 relative min-h-[300px]">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '0.75rem', zIndex: 10 }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={center} zoom={zoom} />
          {userLoc && (
            <Marker position={userLoc}>
              <Popup>Your Location</Popup>
            </Marker>
          )}
          {booths.map(b => (
            <Marker key={b.id} position={[b.lat, b.lon]} icon={redIcon}>
              <Popup>
                <strong>{b.name}</strong><br/>
                <button onClick={() => navigateToBooth(b.lat, b.lon)} className="mt-2 text-primary text-xs font-bold underline" aria-label={`Navigate to ${b.name}`}>{t('booth.navigate')}</button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {booths.length > 0 && (
        <div className="space-y-2" aria-label="Found Booths">
          {booths.map(b => (
            <div key={b.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-sm truncate pr-2">{b.name}</span>
              <button onClick={() => navigateToBooth(b.lat, b.lon)} className="text-xs bg-blue-50 text-primary border border-blue-100 px-3 py-1.5 rounded-lg font-bold shrink-0 hover:bg-blue-100 transition-colors" aria-label={`Navigate to ${b.name}`}>
                {t('booth.navigate')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
