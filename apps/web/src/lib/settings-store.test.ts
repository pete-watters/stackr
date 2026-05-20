import { describe as feature, it as scenario, expect, beforeEach } from 'vitest';
import { bdd } from './bdd';
const { given, when, then } = bdd;
import { useSettingsStore } from './settings-store';

beforeEach(() => {
  useSettingsStore.setState({ etherscanApiKey: '' });
});

feature('settings — Etherscan API key', () => {
  scenario('starts empty', () => {
    then('no key is set', () => {
      expect(useSettingsStore.getState().etherscanApiKey).toBe('');
    });
  });

  scenario('a key can be saved', () => {
    when('a key is entered', () => useSettingsStore.getState().setEtherscanApiKey('test-key-123'));
    then('it is persisted in the store', () => {
      expect(useSettingsStore.getState().etherscanApiKey).toBe('test-key-123');
    });
  });

  scenario('saving a new key overwrites the old one', () => {
    given('an existing key', () => useSettingsStore.getState().setEtherscanApiKey('key-1'));
    when('a new key is saved', () => useSettingsStore.getState().setEtherscanApiKey('key-2'));
    then('only the new key remains', () => {
      expect(useSettingsStore.getState().etherscanApiKey).toBe('key-2');
    });
  });

  scenario('a key can be cleared', () => {
    given('a saved key', () => useSettingsStore.getState().setEtherscanApiKey('some-key'));
    when('it is set to empty', () => useSettingsStore.getState().setEtherscanApiKey(''));
    then('no key is set', () => {
      expect(useSettingsStore.getState().etherscanApiKey).toBe('');
    });
  });
});
