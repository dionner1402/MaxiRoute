import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Image, Dimensions, TouchableOpacity, Text, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

const images = [
  { id: '1', src: require('../../assets/ad1.png') },
  { id: '2', src: require('../../assets/ad2.png') },
  { id: '3', src: require('../../assets/ad3.png') },
];

const AdSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: currentIndex, animated: true });
    }
  }, [currentIndex]);

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image source={item.src} style={styles.image} resizeMode="cover" />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
      />
      <View style={styles.indicatorContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 135,
    position: 'relative',
  },
  slide: {
    width,
    height: 135,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#FFA41F',
  },
});

export default AdSlider;