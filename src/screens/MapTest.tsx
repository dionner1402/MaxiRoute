import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';  // Asegúrate de que estás usando expo-location
import { useIsFocused } from '@react-navigation/native';

const MapTest = () => {
  const [location, setLocation] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState<boolean>(true); // Estado para activar/desactivar el seguimiento
  const mapRef = useRef<MapView | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
      } else {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
      }
    };

    requestLocationPermission();
  }, []); // Esto se ejecuta solo una vez cuando el componente se monta

  useEffect(() => {
    if (location && isTracking) {
      mapRef.current?.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        zoom: 15,
      });

      // Agregar la nueva coordenada a la lista de la ruta
      setRouteCoordinates(prevCoords => [
        ...prevCoords,
        { latitude: location.coords.latitude, longitude: location.coords.longitude }
      ]);
    }
  }, [location, isTracking]); // Este efecto se ejecuta cuando 'location' cambia

  const mapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ color: '#1d2637' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#212121' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2c2c2c' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212121' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#3c3c3c' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#000000' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#3d3d3d' }],
    },
  ];

  if (!location) {
    return <ActivityIndicator size="large" color="#01ced3" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        customMapStyle={mapStyle} // Estilo nocturno
        onMapReady={() => {
          if (location && mapRef.current) {
            mapRef.current.setCamera({
              center: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
              pitch: 60, // Vista inclinada (3D)
              heading: 0,
              zoom: 15,
              altitude: 500,
            });
          }
        }}
      >
        {/* Traza la ruta con una línea */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#FFB85A" // Color de la línea del viaje
          strokeWidth={5}
        />
      </MapView>
    </View>
  );
};

export default MapTest;
