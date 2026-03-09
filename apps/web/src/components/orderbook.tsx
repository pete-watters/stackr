'use client';

import { useState } from 'react';
import type { OrderBook } from '@stackr/models';
import { formatUsd } from '@stackr/services';
import { css } from 'styled-system/css';

interface OrderbookProps {
  orderbook: OrderBook;
}

export function Orderbook({ orderbook }: OrderbookProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSide, setHoveredSide] = useState<'bid' | 'ask' | null>(null);

  const maxCumulative = Math.max(
    orderbook.bids[orderbook.bids.length - 1]?.cumulativeAmount ?? 0,
    orderbook.asks[orderbook.asks.length - 1]?.cumulativeAmount ?? 0,
  );

  const headerStyle = css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    px: 'space.03',
    py: 'space.01',
    textStyle: 'caption.01',
    color: 'ink.text-muted',
    borderBottom: '1px solid',
    borderColor: 'ink.border-subtle',
  });

  const rowStyle = css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    px: 'space.03',
    py: '2px',
    position: 'relative',
    cursor: 'pointer',
    textStyle: 'mono.03',
    transition: 'background 0.1s ease',
  });

  const displayBids = orderbook.bids.slice(0, 15);
  const displayAsks = orderbook.asks.slice(0, 15);

  return (
    <div
      className={css({
        bg: 'ink.component-bg-default',
        borderRadius: 'lg',
        border: '1px solid',
        borderColor: 'ink.border-subtle',
        overflow: 'hidden',
      })}
    >
      <div
        className={css({
          p: 'space.03',
          textStyle: 'label.01',
          borderBottom: '1px solid',
          borderColor: 'ink.border-subtle',
        })}
      >
        Order Book — {orderbook.pair}
      </div>

      {/* Asks (reversed so lowest ask is at bottom) */}
      <div>
        <div className={headerStyle}>
          <span>Price</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
          <span style={{ textAlign: 'right' }}>Total</span>
        </div>
        {[...displayAsks].reverse().map((order, i) => {
          const fillPct = (order.cumulativeAmount / maxCumulative) * 100;
          const isHovered = hoveredSide === 'ask' && hoveredIndex === i;
          return (
            <div
              key={`ask-${i}`}
              className={rowStyle}
              onMouseEnter={() => {
                setHoveredIndex(i);
                setHoveredSide('ask');
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setHoveredSide(null);
              }}
              style={{ background: isHovered ? 'rgba(229, 57, 53, 0.08)' : undefined }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${fillPct}%`,
                  background: 'rgba(229, 57, 53, 0.06)',
                  pointerEvents: 'none',
                }}
              />
              <span className={css({ color: 'error.text' })}>{formatUsd(order.price)}</span>
              <span style={{ textAlign: 'right' }}>{order.amount.toFixed(4)}</span>
              <span style={{ textAlign: 'right' }}>{order.cumulativeAmount.toFixed(4)}</span>
            </div>
          );
        })}
      </div>

      {/* Spread indicator */}
      {orderbook.bids.length > 0 && orderbook.asks.length > 0 && (
        <div
          className={css({
            textAlign: 'center',
            py: 'space.01',
            textStyle: 'caption.01',
            color: 'ink.text-muted',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'ink.border-subtle',
            bg: 'ink.bg-secondary',
          })}
        >
          Spread: {formatUsd(orderbook.asks[0].price - orderbook.bids[0].price)} (
          {(
            ((orderbook.asks[0].price - orderbook.bids[0].price) / orderbook.asks[0].price) *
            100
          ).toFixed(3)}
          %)
        </div>
      )}

      {/* Bids */}
      <div>
        {displayBids.map((order, i) => {
          const fillPct = (order.cumulativeAmount / maxCumulative) * 100;
          const isHovered = hoveredSide === 'bid' && hoveredIndex === i;
          return (
            <div
              key={`bid-${i}`}
              className={rowStyle}
              onMouseEnter={() => {
                setHoveredIndex(i);
                setHoveredSide('bid');
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setHoveredSide(null);
              }}
              style={{ background: isHovered ? 'rgba(0, 178, 117, 0.08)' : undefined }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: `${fillPct}%`,
                  background: 'rgba(0, 178, 117, 0.06)',
                  pointerEvents: 'none',
                }}
              />
              <span className={css({ color: 'success.text' })}>{formatUsd(order.price)}</span>
              <span style={{ textAlign: 'right' }}>{order.amount.toFixed(4)}</span>
              <span style={{ textAlign: 'right' }}>{order.cumulativeAmount.toFixed(4)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
