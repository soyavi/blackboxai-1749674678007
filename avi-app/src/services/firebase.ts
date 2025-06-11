import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function getFCMToken() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Failed to get push token for push notification!');
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    throw new Error('Must use physical device for Push Notifications');
  }

  return token;
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
