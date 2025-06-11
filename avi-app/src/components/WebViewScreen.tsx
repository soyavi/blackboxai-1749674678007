import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getFCMToken, registerTokenOnServer } from '../services/firebase';

const WebViewScreen = () => {
  const [loading, setLoading] = useState(true);

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
        style={styles.webview}
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
