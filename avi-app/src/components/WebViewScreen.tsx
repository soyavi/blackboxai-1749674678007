import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getFCMToken, registerTokenOnServer } from '../services/firebase';
import { Audio } from 'expo-av';

const WebViewScreen = () => {
  const [loading, setLoading] = useState(true);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const permission = await Audio.requestPermissionsAsync();
        setHasAudioPermission(permission.status === 'granted');
        
        if (permission.status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'La aplicación necesita acceso al micrófono para funcionar correctamente.'
          );
        }
      } catch (error) {
        console.error('Error al solicitar permisos de audio:', error);
      }
    })();
  }, []);

  const handleMessage = async (event: any) => {
    try {
      const idUser = event.nativeEvent.data;
      const token = await getFCMToken();
      const type = Platform.OS; // "android" or "ios"
      
      await registerTokenOnServer({
        type,
        id_user: parseInt(idUser, 10),
        token,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color="#007AFF"
        />
      )}
      <WebView
        source={{ uri: 'https://app.loveavi.com' }}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        androidHardwareAccelerationDisabled={false}
        allowsRecordingIOS={true}
        allowsFullscreenVideo={true}
        allowsBackForwardNavigationGestures={true}
        bounces={false}
        scrollEnabled={true}
        startInLoadingState={true}
        style={styles.webview}
        injectedJavaScript={`
          window.addEventListener('load', function() {
            navigator.mediaDevices = navigator.mediaDevices || {};
            navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || 
              navigator.webkitGetUserMedia || 
              navigator.mozGetUserMedia || 
              navigator.msGetUserMedia;
            true;
          });
        `}
        onShouldStartLoadWithRequest={(request) => {
          return true;
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 2,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;
