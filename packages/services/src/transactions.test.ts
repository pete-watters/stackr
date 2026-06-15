import { describe, expect, it } from 'vitest';
import {
  normalizeBtcTransactions,
  normalizeEthTransactions,
  normalizeStxTransactions,
  normalizeSolTransactions,
  normalizeSuiTransactions,
} from './transactions';

const ME = 'bc1qme';

describe('normalizeBtcTransactions', () => {
  it('marks a tx that pays the watched address as a receive and sums those outputs', () => {
    const txs = [
      {
        txid: 'tx1',
        vout: [
          { scriptpubkey_address: ME, value: 50_000_000 },
          { scriptpubkey_address: 'bc1qother', value: 10_000_000 },
        ],
        vin: [{ prevout: { scriptpubkey_address: 'bc1qsender' } }],
        status: { confirmed: true, block_time: 1_700_000_000 },
      },
    ];

    expect(normalizeBtcTransactions(txs, ME)).toEqual([
      {
        hash: 'tx1',
        chain: 'btc',
        type: 'receive',
        amount: '0.50000000',
        counterparty: 'bc1qsender',
        timestamp: new Date(1_700_000_000 * 1000).toISOString(),
        confirmed: true,
      },
    ]);
  });

  it('treats a tx with no output to the address as a send and falls back to now for pending', () => {
    const txs = [
      {
        txid: 'tx2',
        vout: [{ scriptpubkey_address: 'bc1qdest', value: 20_000_000 }],
        vin: [{ prevout: { scriptpubkey_address: ME } }],
        status: undefined,
      },
    ];

    const [tx] = normalizeBtcTransactions(txs, ME);
    expect(tx).toMatchObject({ type: 'send', counterparty: 'bc1qdest', confirmed: false });
  });
});

describe('normalizeEthTransactions', () => {
  it('uses case-insensitive to/from matching to assign direction', () => {
    const txs = [
      {
        hash: '0x1',
        from: '0xSENDER',
        to: ME.toUpperCase(),
        value: '1000000000000000000',
        timeStamp: '1700000000',
        txreceipt_status: '1',
      },
    ];

    expect(normalizeEthTransactions(txs, ME)).toEqual([
      {
        hash: '0x1',
        chain: 'eth',
        type: 'receive',
        amount: '1.00000000',
        counterparty: '0xSENDER',
        timestamp: new Date(1_700_000_000 * 1000).toISOString(),
        confirmed: true,
      },
    ]);
  });
});

describe('normalizeStxTransactions', () => {
  it('keeps only token_transfers and normalizes micro-STX amounts', () => {
    const txs = [
      {
        tx_id: 'st1',
        tx_type: 'token_transfer',
        tx_status: 'success',
        sender_address: 'SPsender',
        burn_block_time_iso: '2026-01-01T00:00:00.000Z',
        token_transfer: { recipient_address: 'SPme', amount: '2000000' },
      },
      { tx_id: 'st2', tx_type: 'contract_call', tx_status: 'success' },
    ];

    expect(normalizeStxTransactions(txs, 'SPme')).toEqual([
      {
        hash: 'st1',
        chain: 'stx',
        type: 'receive',
        amount: '2.000000',
        counterparty: 'SPsender',
        timestamp: '2026-01-01T00:00:00.000Z',
        confirmed: true,
      },
    ]);
  });
});

describe('normalizeSolTransactions', () => {
  it('placeholders direction/amount and derives confirmed from err === null', () => {
    const sigs = [
      { signature: 'sig1', blockTime: 1_700_000_000, err: null },
      { signature: 'sig2', blockTime: null, err: { InstructionError: [] } },
    ];

    const result = normalizeSolTransactions(sigs);

    expect(result[0]).toMatchObject({
      hash: 'sig1',
      type: 'receive',
      amount: '0',
      confirmed: true,
    });
    expect(result[1]).toMatchObject({ hash: 'sig2', confirmed: false });
  });
});

describe('normalizeSuiTransactions', () => {
  const SUI = '0x2::sui::SUI';
  const SUI_ME = `0x${'a'.repeat(64)}`;
  const SUI_OTHER = `0x${'b'.repeat(64)}`;

  it('reads direction and amount from the watched address SUI balance delta', () => {
    const txs = [
      {
        digest: 'd_in',
        timestampMs: '1700000000000',
        transaction: { data: { sender: SUI_OTHER } },
        balanceChanges: [
          { coinType: SUI, amount: '1500000000', owner: { AddressOwner: SUI_ME } },
          { coinType: SUI, amount: '-1500000000', owner: { AddressOwner: SUI_OTHER } },
        ],
      },
    ];

    expect(normalizeSuiTransactions(txs, SUI_ME)).toEqual([
      {
        hash: 'd_in',
        chain: 'sui',
        type: 'receive',
        amount: '1.500000000',
        counterparty: SUI_OTHER,
        timestamp: new Date(1_700_000_000_000).toISOString(),
        confirmed: true,
      },
    ]);
  });

  it('marks a negative delta as a send and reports the recipient as counterparty', () => {
    const txs = [
      {
        digest: 'd_out',
        timestampMs: '1700000001000',
        transaction: { data: { sender: SUI_ME } },
        balanceChanges: [
          { coinType: SUI, amount: '-2000000000', owner: { AddressOwner: SUI_ME } },
          { coinType: SUI, amount: '2000000000', owner: { AddressOwner: SUI_OTHER } },
        ],
      },
    ];

    const [tx] = normalizeSuiTransactions(txs, SUI_ME);
    expect(tx).toMatchObject({ type: 'send', amount: '2.000000000', counterparty: SUI_OTHER });
  });

  it('dedupes overlapping From/To blocks on digest and sorts newest first', () => {
    const base = {
      transaction: { data: { sender: SUI_OTHER } },
      balanceChanges: [{ coinType: SUI, amount: '1000000000', owner: { AddressOwner: SUI_ME } }],
    };
    const txs = [
      { digest: 'old', timestampMs: '1700000000000', ...base },
      { digest: 'new', timestampMs: '1700000005000', ...base },
      { digest: 'old', timestampMs: '1700000000000', ...base },
    ];

    const result = normalizeSuiTransactions(txs, SUI_ME);
    expect(result.map(t => t.hash)).toEqual(['new', 'old']);
  });

  it('falls back to amount 0 and sender-based direction when no SUI moves for the address', () => {
    const txs = [
      {
        digest: 'd_obj',
        timestampMs: '1700000002000',
        transaction: { data: { sender: SUI_ME } },
        balanceChanges: [
          { coinType: '0x2::other::COIN', amount: '5', owner: { AddressOwner: SUI_ME } },
        ],
      },
    ];

    const [tx] = normalizeSuiTransactions(txs, SUI_ME);
    expect(tx).toMatchObject({ type: 'send', amount: '0.000000000', counterparty: 'unknown' });
  });
});
