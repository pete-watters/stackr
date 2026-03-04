import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stackr</Text>
      <Text style={styles.subtitle}>Multi-chain portfolio tracker</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0d0d',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fafafa',
  },
  subtitle: {
    fontSize: 16,
    color: '#a3a3a3',
    marginTop: 8,
  },
});
