import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export async function getFCMToken() {
  try {
    // Check if we have permission on iOS (Android doesn't need this)
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        throw new Error('Las notificaciones no están habilitadas');
      }
    }

    // Get the FCM token
    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      throw new Error('No se pudo obtener el token FCM');
    }
    
    console.log('Token FCM obtenido:', fcmToken);
    return fcmToken;
  } catch (error) {
    console.error('Error al obtener token FCM:', error);
    throw new Error('No se pudo obtener el token de notificaciones');
  }
}

interface TokenRegistration {
  type: string;
  id_user: number;
  token: string;
}

export async function registerTokenOnServer({ type, id_user, token }: TokenRegistration) {
  try {
    const response = await fetch('https://api.loveavi.com/notifications/setToken.php', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Origin': 'https://app.soyavi.com',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify({
        type,
        id_user,
        token,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error registering token:', error);
    throw new Error('Failed to register notification token');
  }
}
