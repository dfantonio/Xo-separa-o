import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { db } from '../config/firebase';
import type { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'CreateSession'>;

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CreateSessionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor, informe seu nome.');
      return;
    }

    setLoading(true);
    try {
      const code = generateCode();
      const sessionRef = doc(collection(db, 'sessions'));
      const sessionId = sessionRef.id;

      await setDoc(sessionRef, {
        code,
        memberA: { name: name.trim(), score: 0 },
        memberB: null,
        createdAt: serverTimestamp(),
        lastResetMonth: new Date().toISOString().slice(0, 7),
      });

      await SecureStore.setItemAsync('sessionId', sessionId);
      await SecureStore.setItemAsync('memberId', 'memberA');

      setGeneratedCode(code);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a sessão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (generatedCode) {
      Clipboard.setString(generatedCode);
      Alert.alert('Copiado!', 'Código copiado para a área de transferência.');
    }
  }

  function handleContinue() {
    navigation.replace('Home');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar casal</Text>

      {!generatedCode ? (
        <>
          <Text style={styles.label}>Seu nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Como você quer ser chamado(a)?"
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Gerar código</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.successText}>Sessão criada com sucesso!</Text>
          <Text style={styles.codeLabel}>Seu código de convite:</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{generatedCode}</Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyButtonText}>Copiar código</Text>
          </TouchableOpacity>
          <Text style={styles.instructions}>
            Compartilhe este código com seu cônjuge para que ele(a) possa entrar na sessão.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </>
      )}
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
    marginBottom: 24,
    color: '#333',
  },
  button: {
    backgroundColor: '#E94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E94560',
  },
  code: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: '#E94560',
    fontFamily: 'monospace',
  },
  copyButton: {
    borderWidth: 2,
    borderColor: '#E94560',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  copyButtonText: {
    color: '#E94560',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
});
