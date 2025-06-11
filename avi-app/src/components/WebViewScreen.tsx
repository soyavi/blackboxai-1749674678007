import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getFCMToken, registerTokenOnServer } from '../services/firebase';
import { Audio } from 'expo-av';

const WebViewScreen = () => {
  const [loading, setLoading] = useState(true);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (loading && retryCount < 3) {
      const timeout = setTimeout(() => {
        if (loading) {
          console.log('WebView load timeout, retrying...');
          setRetryCount(prev => prev + 1);
          webViewRef.current?.reload();
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [loading, retryCount]);

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
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ 
          uri: 'https://app.loveavi.com',
          headers: Platform.select({
            ios: {
              'Cache-Control': 'no-cache',
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
            },
            android: {
              'Cache-Control': 'no-cache'
            }
          })
        }}
        style={[
          styles.webview,
          { opacity: loading ? 0 : 1, backgroundColor: '#ffffff' }
        ]}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        scrollEnabled={true}
        bounces={false}
        startInLoadingState={true}
        renderLoading={() => <View />}
        onContentProcessDidTerminate={() => {
          console.log('Content process terminated, reloading...');
          webViewRef.current?.reload();
        }}
        cacheEnabled={Platform.OS === 'ios'}
        onRenderProcessGone={() => {
          console.log('Render process gone, reloading...');
          webViewRef.current?.reload();
        }}
        onLoadStart={() => {
          setLoading(true);
          console.log(`WebView starting to load (attempt ${retryCount + 1}/3)`);
        }}
        onLoadEnd={() => {
          setLoading(false);
          setRetryCount(0);
          console.log('WebView loaded successfully');
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
          setLoading(false);
          
          if (retryCount < 3) {
            console.log(`Retrying load (attempt ${retryCount + 1}/3)...`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              webViewRef.current?.reload();
            }, 1000);
          } else {
            console.log('Max retry attempts reached');
          }
        }}
        onMessage={(event) => {
          const data = event.nativeEvent.data;
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.type === 'error') {
              console.warn('WebView error:', parsedData.message);
            } else if (parsedData.type === 'load') {
              console.log('WebView loaded:', parsedData.message);
            } else {
              handleMessage(event);
            }
          } catch (e) {
            handleMessage(event);
          }
        }}
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

          (function() {
            function checkAndReload() {
              if (document.body.innerHTML === '') {
                console.log('Página en blanco detectada, recargando...');
                window.location.reload();
                return;
              }
              
              // Configurar viewport
              var viewport = document.querySelector('meta[name="viewport"]');
              if (!viewport) {
                viewport = document.createElement('meta');
                viewport.setAttribute('name', 'viewport');
                document.head.appendChild(viewport);
              }
              viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
              );

              // Forzar reflow para iOS
              document.body.style.webkitTransform = 'scale(1)';
              setTimeout(function() { 
                document.body.style.webkitTransform = ''; 
              }, 0);
            }

            // Ejecutar al cargar
            checkAndReload();
            
            // Ejecutar después de cualquier cambio dinámico
            var observer = new MutationObserver(checkAndReload);
            observer.observe(document.documentElement, {
              childList: true,
              subtree: true
            });

            true;
          })();
        `}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default WebViewScreen;
