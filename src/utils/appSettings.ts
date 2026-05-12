import { supabase, profileAPI } from '../api/supabase';
import { ASGARI_NET, ASGARI_SGK, DEFAULT_DAILY_MEAL, DEFAULT_ELECTRIC_PRICE, DEFAULT_WORK_DAYS } from './constants';

export interface AppSettings {
  asgariUcret: number;       // Asgari net ücret (₺/ay)
  asgariSgk: number;         // İşveren SGK payı (₺/ay)
  yemekUcreti: number;       // Günlük yemek yardımı (₺/gün)
  elektrikBirimFiyat: number; // Elektrik birim fiyatı (₺/kWh)
  suBirimFiyat: number;      // Su birim fiyatı (₺/m³)
  aylikGun: number;          // Aylık çalışma günü
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  asgariUcret: ASGARI_NET,
  asgariSgk: ASGARI_SGK,
  yemekUcreti: DEFAULT_DAILY_MEAL,
  elektrikBirimFiyat: DEFAULT_ELECTRIC_PRICE,
  suBirimFiyat: 15,
  aylikGun: DEFAULT_WORK_DAYS,
};

export const settingsAPI = {
  async get(): Promise<AppSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_APP_SETTINGS;
      const { data } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();
      if (!data?.settings) return DEFAULT_APP_SETTINGS;
      return { ...DEFAULT_APP_SETTINGS, ...data.settings };
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  },

  async save(settings: AppSettings): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { error } = await supabase
        .from('profiles')
        .update({ settings })
        .eq('id', user.id);
      if (!error) profileAPI.clearCache();
      return !error;
    } catch {
      return false;
    }
  },
};
