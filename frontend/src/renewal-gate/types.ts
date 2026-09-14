export interface RenewalStatus {
  active: boolean;
  renewal_date: string | null;
  amount: number | null;
  name: string | null;
  customer_id: string;
}
