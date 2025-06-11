import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getFCMToken, registerTokenOnServer } from '../services/firebase';
import * as Permissions from 'expo-permissions';

const WebViewScreen = () => {
  const [loading, setLoading] = useState(true);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status: existingStatus } = await Permissions.getAsync(Permissions.AUDIO_RECORDING);
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
        finalStatus = status;
      }
      
      setHasAudioPermission(finalStatus === 'granted');
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'La aplicación necesita acceso al micrófono para funcionar correctamente.'
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
        source={{ uri: 'https://app.soyavi.com' }}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        androidHardwareAccelerationDisabled={false}
        allowsRecordingIOS={true}
        allowsFullscreenVideo={true}
        style={styles.webview}
        injectedJavaScript={`
          navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || 
          navigator.webkitGetUserMedia || 
          navigator.mozGetUserMedia || 
          navigator.msGetUserMedia;
          true;
        `}
        onShouldStartLoadWithRequest={() => true}
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
