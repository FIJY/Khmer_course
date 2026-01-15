import en from './en';

const dictionary = { en };

export const t = (key, params = {}, locale = 'en') => {
  const parts = key.split('.');
  let value = dictionary[locale];
  for (const part of parts) {
    value = value?.[part];
  }
  if (typeof value !== 'string') return key;
  return Object.keys(params).reduce((result, param) => (
    result.replace(`{${param}}`, params[param])
  ), value);
};
