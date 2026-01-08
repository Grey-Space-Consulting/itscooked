import type { AuthTokens, AuthTransaction } from "./types";

const tokensKey = "itscooked.auth.tokens";
const transactionKey = "itscooked.auth.transaction";

export function loadTokens(): AuthTokens | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(tokensKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens | null) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  if (!tokens) {
    sessionStorage.removeItem(tokensKey);
    return;
  }

  sessionStorage.setItem(tokensKey, JSON.stringify(tokens));
}

export function loadTransaction(): AuthTransaction | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(transactionKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTransaction;
  } catch {
    return null;
  }
}

export function saveTransaction(transaction: AuthTransaction | null) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  if (!transaction) {
    sessionStorage.removeItem(transactionKey);
    return;
  }

  sessionStorage.setItem(transactionKey, JSON.stringify(transaction));
}
