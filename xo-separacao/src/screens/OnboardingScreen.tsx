import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function OnboardingScreen({ navigation }: Props) {
  useEffect(() => {
    async function checkSession() {
      const sessionId = await SecureStore.getItemAsync('sessionId');
      if (sessionId) {
        navigation.replace('Home');
      }
    }
    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xô Separação</Text>
      <Text style={styles.slogan}>Organize a rotina do lar juntos 💑</Text>
      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate('CreateSession')}
      >
        <Text style={styles.buttonText}>Criar casal</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('JoinSession')}
      >
        <Text style={styles.buttonTextSecondary}>Entrar com código</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: '#555',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSecondary: {
    borderWidth: 2,
    borderColor: '#E63946',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: '#E63946',
    fontSize: 18,
    fontWeight: '600',
  },
});
