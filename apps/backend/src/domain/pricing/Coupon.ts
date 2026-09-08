export interface Coupon {
  readonly code: string;
  readonly rate: number;
  readonly expiresAt: Date | null;
}
