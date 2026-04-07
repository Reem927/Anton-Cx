export interface ExtendedCompareRow {
  policy_id: string;
  payer_id: string;
  drug_name: string;
  coverage_label: string;
  dosage_amount: string;
  coverage_percent: number;
  estimated_price: number;
  estimated_copay: number;
  molecule_type: string;
  therapeutic_area: string;
  related_products: string[];
  policy_scope_note: string;
}