export type LoginMethod = 'phone_code' | 'email_code' | 'password';

export type RegionMode = 'cn' | 'overseas';

export interface CountryCodeItem {
  code: string;
  dial: string;
  name: string;
}

export interface SendCodeParams {
  email?: string;
  phone?: string;
  countryCode?: string;
}

export interface LoginByCodeParams {
  account: string;
  code: string;
  countryCode?: string;
}

export interface LoginByPasswordParams {
  account: string;
  password: string;
}

export interface RegisterParams {
  email?: string;
  phone?: string;
  countryCode?: string;
  password?: string;
  code: string;
}
