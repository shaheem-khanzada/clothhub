import { creamButton } from '@/components/ui/button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { navLinks } from '@/content/site';
import { cx } from '@/lib/cx';

export function SiteHeader() {
  return (
    <header className="relative z-10">
      <Container className="flex items-center justify-between gap-6 py-5.5">
        <a href="#top" aria-label="ClothHub home" className="text-white no-underline">
          <Logo />
        </a>

        <nav aria-label="Main" className="flex items-center gap-8 max-md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-fog no-underline transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#join" className={cx(creamButton, 'h-11 px-5 text-[15px]')}>
          Get early access
        </a>
      </Container>
    </header>
  );
}
