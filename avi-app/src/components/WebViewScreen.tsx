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
        console.log('Solicitando permisos de audio...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        
        const permission = await Audio.requestPermissionsAsync();
        console.log('Estado del permiso:', permission.status);
        setHasAudioPermission(permission.status === 'granted');
        
        if (permission.status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'La aplicación necesita acceso al micrófono para funcionar correctamente.'
          );
        }
      } catch (error) {
        console.error('Error al solicitar permisos de audio:', error);
        Alert.alert(
          'Error',
          'No se pudieron obtener los permisos de audio. Por favor, intenta nuevamente.'
        );
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
        source={{ 
          uri: 'https://app.loveavi.com',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }}
        originWhitelist={['*']}
        sharedCookiesEnabled={true}
        incognito={false}
        useWebKit={true}
        mixedContentMode="compatibility"
        onNavigationStateChange={(navState) => {
          console.log('Navigation State:', navState);
        }}
        onLoadEnd={() => {
          setLoading(false);
          console.log('WebView loaded');
        }}
        onLoadStart={() => console.log('WebView starting to load')}
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
        cacheEnabled={false}
        style={[styles.webview, { backgroundColor: '#ffffff' }]}
        injectedJavaScript={`
          window.onerror = function(message, source, lineno, colno, error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: message,
              source: source,
              lineno: lineno,
              colno: colno,
              error: error ? error.toString() : null
            }));
            return true;
          };
          
          window.addEventListener('load', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'load',
              message: 'Page loaded successfully'
            }));
            
            navigator.mediaDevices = navigator.mediaDevices || {};
            navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || 
              navigator.webkitGetUserMedia || 
              navigator.mozGetUserMedia || 
              navigator.msGetUserMedia;
          });
          true;
        `}
        onShouldStartLoadWithRequest={(request) => {
          console.log('Loading URL:', request.url);
          return true;
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error:', nativeEvent);
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
