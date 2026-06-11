# Manual test scenarios

These cover the flows that can't be meaningfully automated yet — real wallet
extensions (MetaMask, Phantom, Leather/Xverse), cross-wallet interactions, and
responsive layout. Run them in a real browser before recording a demo or
cutting a release.

Written in Gherkin (`Given` / `When` / `Then` / `And`) so each step is an
unambiguous action with an observable outcome. Automated unit/E2E tests use the
same vocabulary (see `apps/web/src/lib/bdd.ts`); these are the human-run
counterpart.

Pre-requisites for the full suite:

- MetaMask, Phantom, and Leather (or Xverse) browser extensions installed
- Each wallet holding at least one asset on mainnet (or a known funded address)
- A second device / responsive devtools for the mobile checks

---

## Feature: MetaMask (Ethereum) connection

```gherkin
Scenario: Connecting MetaMask shows ETH holdings
  Given I am on the stackr dashboard with no wallets connected
  When I open the connect flow and choose MetaMask
  And I approve the connection in the MetaMask popup
  Then my Ethereum address appears in the portfolio with a "Connected" badge
  And my ETH balance and ERC-20 token balances render with USD values

Scenario: ENS name resolves for a connected address
  Given my connected MetaMask address owns an ENS name
  When the portfolio finishes loading
  Then the ENS name is shown in place of (or alongside) the raw 0x address

Scenario: Disconnecting MetaMask removes its holdings
  Given MetaMask is connected and showing holdings
  When I disconnect MetaMask
  Then the Ethereum connected entry disappears from the portfolio
  And the total portfolio value decreases by the ETH holdings

Scenario: MetaMask reconnects automatically after a page refresh
  Given MetaMask is connected
  When I refresh the page
  Then the Ethereum address is shown again without a new approval popup
```

## Feature: Phantom (Solana) connection

```gherkin
Scenario: Connecting Phantom shows SOL holdings
  Given I am on the dashboard
  When I open the connect flow and choose Phantom
  And I approve the connection in the Phantom popup
  Then my Solana address appears with a "Connected" badge
  And my SOL balance and SPL token balances render with USD values

Scenario: Disconnecting Phantom removes its holdings
  Given Phantom is connected and showing holdings
  When I disconnect Phantom
  Then the Solana connected entry disappears from the portfolio

Scenario: Phantom reconnects automatically after a page refresh
  Given Phantom is connected
  When I refresh the page
  Then the Solana address is shown again without a new approval popup
```

## Feature: Leather / Xverse (Stacks + Bitcoin) connection

```gherkin
Scenario: Connecting Leather lights up BOTH Stacks and Bitcoin
  Given I am on the dashboard
  When I open the connect flow and choose Leather
  And I approve the connection in the Leather popup
  Then my Stacks address appears with a "Connected" badge
  And my derived Bitcoin address appears with a "Connected" badge
  And both STX and BTC balances render with USD values

Scenario: A .btc BNS name resolves for the Stacks address
  Given my connected Stacks address owns a .btc name
  When the portfolio finishes loading
  Then the .btc name is shown for the Stacks entry

Scenario: The same flow works with Xverse
  Given Xverse is installed instead of Leather
  When I open the connect flow and choose the Stacks wallet option
  Then Xverse is offered in the wallet picker
  And approving it populates the Stacks and Bitcoin entries the same way

Scenario: Disconnecting Leather clears both chains at once
  Given Leather is connected and showing Stacks and Bitcoin holdings
  When I disconnect Leather
  Then both the Stacks and Bitcoin connected entries disappear together

Scenario: Leather reconnects automatically after a page refresh
  Given Leather is connected
  When I refresh the page
  Then both the Stacks and Bitcoin addresses are shown again without a new popup
```

## Feature: Multiple wallets connected at once

```gherkin
Scenario: All three wallets coexist
  Given no wallets are connected
  When I connect MetaMask
  And I connect Phantom
  And I connect Leather
  Then connecting each wallet does NOT disconnect the others
  And the portfolio shows Ethereum, Solana, Stacks, and Bitcoin holdings together
  And the total portfolio value is the sum of all connected holdings

Scenario: Per-chain status is visible in the header
  Given one or more wallets are connected
  Then the header shows a lit status indicator for each connected chain
  And an unlit (dimmed) indicator for chains that are not connected
```

## Feature: Watch-only and connected address de-duplication

```gherkin
Scenario: A watch-only address that matches a connected wallet is not duplicated
  Given I have added a watch-only Ethereum address
  When I connect MetaMask using that same address
  Then the portfolio shows ONE entry for that address, not two
  And that entry carries the "Connected" badge

Scenario: Watch-only and connected addresses both contribute to the total
  Given I have a watch-only Bitcoin cold-storage address
  And MetaMask is connected
  Then the total portfolio value includes both the watch-only and connected holdings
```

## Feature: Responsive layout

```gherkin
Scenario: The dashboard is usable at 375px
  Given I view the dashboard at 375px width (mobile)
  Then the portfolio summary, wallet cards, and connect controls render without horizontal scroll
  And no element overlaps or is clipped

Scenario: The connect controls are reachable on mobile
  Given I view the dashboard at 375px width
  When I open the connect flow
  Then every wallet option is tappable and fully visible
```

## Feature: Currency and privacy toggles

```gherkin
Scenario: Switching currency updates all values
  Given holdings are displayed in USD
  When I change the currency to EUR in Settings
  Then every fiat value re-renders in EUR
  And the choice persists across a page refresh

Scenario: Hide-balance mode masks values
  Given holdings are displayed
  When I toggle hide-balance mode from the header (the eye icon)
  Then all fiat values are replaced with a mask (••••)
  And toggling it off restores the real values
```
