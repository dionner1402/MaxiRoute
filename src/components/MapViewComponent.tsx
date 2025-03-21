// src/components/MapViewComponent.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export const MapViewComponent = ({ location }) => {
  return location ? (
    <MapView
      style={{ flex: 1 }}
      region={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      showsUserLocation={true}
    >
      <Marker
        coordinate={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }}
        title="Ubicación Actual"
      />
    </MapView>
  ) : (
    <ActivityIndicator size="large" color="#0000ff" />
  );
};
