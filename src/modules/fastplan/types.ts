import type { PlanParams, PlanSonuc } from '../../utils/fastPlanCalc';

export interface PlanVersion {
  tarih: string;
  params: PlanParams;
  sonuc: PlanSonuc;
  not?: string;
}

export interface PlanCard {
  id: string;
  supabaseId?: string;
  baslik: string;
  aciklama: string;
  etiket?: string;
  status: 'pending' | 'active' | 'archived';
  createdAt: string;
  updatedAt?: string;
  versions?: PlanVersion[];
  params: PlanParams;
  sonuc: PlanSonuc;
}
