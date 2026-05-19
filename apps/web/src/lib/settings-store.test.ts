import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settings-store';

describe('settings store', () => {
  beforeEach(() => {
    useSettingsStore.setState({ etherscanApiKey: '' });
  });

  it('initializes with empty API key', () => {
    expect(useSettingsStore.getState().etherscanApiKey).toBe('');
  });

  it('sets etherscan API key', () => {
    useSettingsStore.getState().setEtherscanApiKey('test-key-123');
    expect(useSettingsStore.getState().etherscanApiKey).toBe('test-key-123');
  });

  it('overwrites existing API key', () => {
    useSettingsStore.getState().setEtherscanApiKey('key-1');
    useSettingsStore.getState().setEtherscanApiKey('key-2');
    expect(useSettingsStore.getState().etherscanApiKey).toBe('key-2');
  });

  it('can clear API key', () => {
    useSettingsStore.getState().setEtherscanApiKey('some-key');
    useSettingsStore.getState().setEtherscanApiKey('');
    expect(useSettingsStore.getState().etherscanApiKey).toBe('');
  });
});
