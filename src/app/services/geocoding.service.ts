import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private mapboxToken = environment.mapbox.accessToken;

  // Diccionario de direcciones problemáticas conocidas con coordenadas correctas
  private knownAddresses: { [key: string]: [number, number] } = {
    'Psje. Fredy Alvarado 859 Of. 3037, La Reina, Región Metropolitana, 0190050': [-70.5195, -33.4414], // La Reina
    'Fredy Alvarado 859, La Reina': [-70.5195, -33.4414],
    'Fredy Alvarado, La Reina': [-70.5195, -33.4414],
    'La Reina, Región Metropolitana': [-70.5195, -33.4414],
  };

  constructor() {}

  private getKnownAddressCoordinates(address: string): [number, number] | null {
    // Buscar coincidencia exacta
    if (this.knownAddresses[address]) {
      return this.knownAddresses[address];
    }
    
    // Buscar coincidencias parciales para direcciones similares
    const addressLower = address.toLowerCase();
    for (const knownAddress of Object.keys(this.knownAddresses)) {
      if (addressLower.includes('fredy alvarado') && addressLower.includes('la reina')) {
        return this.knownAddresses[knownAddress];
      }
    }
    
    return null;
  }

  async getCoordinates(address: string): Promise<[number, number]> {
    // Primero verificar si tenemos la dirección en nuestro diccionario
    const knownCoords = this.getKnownAddressCoordinates(address);
    if (knownCoords) {
      console.log('✅ Usando coordenadas conocidas para:', address, '→', knownCoords);
      return knownCoords;
    }
    
    const encodedAddress = encodeURIComponent(address);
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.mapboxToken}&country=cl&proximity=-70.6693,-33.4489`;

    try {
      console.log('🔍 Geocodificando dirección:', address);
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (!data.features.length) {
        console.warn('❌ No se encontraron resultados para:', address);
        throw new Error('No se encontró la dirección.');
      }

      const coordinates = data.features[0].geometry.coordinates;
      const placeName = data.features[0].place_name;
      
      console.log('📍 Coordenadas obtenidas:', coordinates, 'para:', placeName);
      
      // Validar que las coordenadas están en Chile
      const [lng, lat] = coordinates;
      const chileValidation = {
        lat: lat >= -56 && lat <= -17,
        lng: lng >= -109 && lng <= -66
      };
      
      if (!chileValidation.lat || !chileValidation.lng) {
        console.warn('⚠️ Coordenadas fuera de Chile:', coordinates, 'usando Santiago por defecto');
        return [-70.6693, -33.4489]; // Santiago por defecto
      }

      return coordinates;
    } catch (error) {
      console.error('Error obteniendo coordenadas:', error);
      console.warn('🏠 Usando coordenadas de Santiago por defecto');
      return [-70.6693, -33.4489]; // Santiago por defecto en lugar de [0,0]
    }
  }

  async getRoute(origin: [number, number], destination: [number, number]): Promise<{ distance: number; geometry?: any }> {
    if (
      !origin || !destination ||
      isNaN(origin[0]) || isNaN(origin[1]) ||
      isNaN(destination[0]) || isNaN(destination[1]) ||
      Math.abs(destination[0]) > 180 || Math.abs(destination[1]) > 90
    ) {
      console.warn('Coordenadas inválidas para ruta:', { origin, destination });
      return { distance: -1 };
    }
  
    const routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${this.mapboxToken}`;
  
    try {
      const response = await fetch(routeUrl);
      const data = await response.json();
  
      if (!data.routes || !data.routes.length) throw new Error('No se encontró ruta.');
  
      return { 
        distance: data.routes[0].distance / 1000,
        geometry: data.routes[0].geometry
      };
    } catch (error) {
      console.error('Error obteniendo ruta:', error);
      return { distance: -1 };
    }
  }

  async getReverseGeocode(coordinates: [number, number]): Promise<{ address: string; comuna: string; region: string } | null> {
    const [lng, lat] = coordinates;
    
    // Validar coordenadas
    if (isNaN(lng) || isNaN(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
      console.warn('Coordenadas inválidas para geocodificación inversa:', coordinates);
      return null;
    }
    
    const reverseGeocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.mapboxToken}&language=es&types=address,place,locality,district`;
    
    try {
      console.log('🔍 Obteniendo dirección para coordenadas:', { lat, lng });
      const response = await fetch(reverseGeocodeUrl);
      const data = await response.json();
      
      if (!data.features || !data.features.length) {
        console.warn('No se encontró información de dirección para las coordenadas');
        return null;
      }
      
      // Procesar los resultados para extraer información relevante
      const features = data.features;
      let address = '';
      let comuna = '';
      let region = '';
      
      // Buscar diferentes tipos de información en las features
      for (const feature of features) {
        const placeName = feature.place_name || '';
        const placeType = feature.place_type || [];
        
        // Extraer comuna (locality, place, district)
        if (!comuna && (placeType.includes('place') || placeType.includes('locality') || placeType.includes('district'))) {
          comuna = feature.text || '';
        }
        
        // Extraer región
        if (!region && placeType.includes('region')) {
          region = feature.text || '';
        }
        
        // Usar el primer resultado como dirección principal
        if (!address && placeName) {
          address = placeName;
        }
      }
      
      // Si no encontramos comuna en place_type, buscar en el contexto
      if (!comuna) {
        for (const feature of features) {
          if (feature.context) {
            for (const contextItem of feature.context) {
              if (contextItem.id && (contextItem.id.includes('place') || contextItem.id.includes('locality'))) {
                comuna = contextItem.text || '';
                break;
              }
            }
          }
          if (comuna) break;
        }
      }
      
      // Si no encontramos región en place_type, buscar en el contexto
      if (!region) {
        for (const feature of features) {
          if (feature.context) {
            for (const contextItem of feature.context) {
              if (contextItem.id && contextItem.id.includes('region')) {
                region = contextItem.text || '';
                break;
              }
            }
          }
          if (region) break;
        }
      }
      
      // Limpiar y formatear los resultados
      address = address.replace(/,\s*Chile$/, '').trim(); // Remover ", Chile" del final
      comuna = comuna.trim();
      region = region.trim();
      
      console.log('📍 Geocodificación inversa exitosa:', {
        address: address || 'Dirección no disponible',
        comuna: comuna || 'Comuna no identificada',
        region: region || 'Región no identificada'
      });
      
      return {
        address: address || 'Ubicación personalizada',
        comuna: comuna || 'Comuna no identificada',
        region: region || 'Región no identificada'
      };
      
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
      return null;
    }
  }
  
}