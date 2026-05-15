export enum Currency {
  USD = 0,
  EUR = 1,
  ZAR = 2,
  GBP = 3,
}

export const CurrencySymbols: Record<Currency, string> = {
  [Currency.USD]: "$",
  [Currency.EUR]: "€",
  [Currency.ZAR]: "R",
  [Currency.GBP]: "£",
};
