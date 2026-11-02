import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LANGUAGES = [
  { code: 'en',      label: 'English' },
  { code: 'ms',      label: 'Bahasa Melayu' },
  { code: 'id',      label: 'Bahasa Indonesia' },
  { code: 'th',      label: 'ภาษาไทย' },
  { code: 'vi',      label: 'Tiếng Việt' },
  { code: 'km',      label: 'ភាសាខ្មែរ' },
  { code: 'my',      label: 'မြန်မာဘာသာ' },
  { code: 'zh-Hans', label: '中文（简体）' },
  { code: 'zh-Hant', label: '中文（繁體）' },
  { code: 'ja',      label: '日本語' },
  { code: 'ko',      label: '한국어' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          title="Change Language"
        >
          <Globe className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-y-auto">
        {LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`cursor-pointer ${i18n.language === lang.code ? 'bg-teal-50 text-teal-700 font-medium' : ''}`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}