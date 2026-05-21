'use client';

import { useTheme } from 'next-themes';
import { Palette, Monitor, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from '@stackr/ui';
import { THEMES } from '@/lib/theme-config';

function ThemeSwatch({ bg, accent }: { bg: string; accent: string }) {
  return (
    <span className="mr-2 inline-flex h-4 w-4 flex-shrink-0 overflow-hidden rounded-sm border border-border/40">
      <span style={{ background: bg }} className="flex-1" />
      <span style={{ background: accent }} className="flex-1" />
    </span>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        {THEMES.map(t => (
          <DropdownMenuItem key={t.value} onClick={() => setTheme(t.value)}>
            <ThemeSwatch bg={t.bg} accent={t.accent} />
            <span className="flex-1">{t.label}</span>
            {theme === t.value && <Check className="ml-2 h-3.5 w-3.5 text-muted-foreground" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="flex-1">System</span>
          {theme === 'system' && <Check className="ml-2 h-3.5 w-3.5 text-muted-foreground" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
