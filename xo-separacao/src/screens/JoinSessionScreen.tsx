import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { db } from '../config/firebase';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'JoinSession'>;

export default function JoinSessionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [nameError, setNameError] = useState('');

  async function handleJoin() {
    let valid = true;

    if (!code.trim()) {
      setCodeError('Informe o código de convite.');
      valid = false;
    } else {
      setCodeError('');
    }

    if (!name.trim()) {
      setNameError('Informe seu nome.');
      valid = false;
    } else {
      setNameError('');
    }

    if (!valid) return;

    setLoading(true);
    try {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('code', '==', code.trim().toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setCodeError('Código inválido.');
        setLoading(false);
        return;
      }

      const sessionDoc = snapshot.docs[0];
      const sessionData = sessionDoc.data();

      if (sessionData.memberB !== null) {
        setCodeError('Esta sessão já está completa.');
        setLoading(false);
        return;
      }

      const sessionId = sessionDoc.id;

      await updateDoc(doc(db, 'sessions', sessionId), {
        memberB: { name: name.trim(), score: 0 },
      });

      await SecureStore.setItemAsync('sessionId', sessionId);
      await SecureStore.setItemAsync('memberId', 'memberB');

      navigation.replace('Home');
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar na sessão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar com código</Text>

      <Text style={styles.label}>Código de convite</Text>
      <TextInput
        style={[styles.input, !!codeError && styles.inputError]}
        placeholder="Ex: XO4F2A"
        value={code}
        onChangeText={(text) => {
          setCode(text.toUpperCase());
          if (codeError) setCodeError('');
        }}
        maxLength={6}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {!!codeError && <Text style={styles.errorText}>{codeError}</Text>}

      <Text style={styles.label}>Seu nome</Text>
      <TextInput
        style={[styles.input, !!nameError && styles.inputError]}
        placeholder="Como você quer ser chamado(a)?"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (nameError) setNameError('');
        }}
        maxLength={30}
        autoCapitalize="words"
      />
      {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleJoin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E94560',
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  inputError: {
    borderColor: '#E94560',
  },
  errorText: {
    fontSize: 13,
    color: '#E94560',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#E94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
