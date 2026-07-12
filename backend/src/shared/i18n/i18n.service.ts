import { Injectable } from '@nestjs/common';
import { tenantLocalStorage } from '../common/tenant-context/tenant-store';

@Injectable()
export class I18nService {
  private locales: Record<string, Record<string, string>> = {};

  constructor() {
    // Dynamically require locales using relative path
    this.locales['es'] = require('./locales/es.json');
    this.locales['en'] = require('./locales/en.json');
  }

  translate(key: string, args?: Record<string, string>): string {
    const store = tenantLocalStorage.getStore();
    const lang = store?.lang || 'es';
    
    const langDict = this.locales[lang] || this.locales['es'];
    let translated = langDict[key] || key;

    if (args) {
      Object.keys(args).forEach((argKey) => {
        translated = translated.replace(`{${argKey}}`, args[argKey]);
      });
    }

    return translated;
  }

  // Alias for ease of use
  t(key: string, args?: Record<string, string>): string {
    return this.translate(key, args);
  }
}
