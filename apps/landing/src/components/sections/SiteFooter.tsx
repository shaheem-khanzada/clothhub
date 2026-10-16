import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { footerLinks } from '@/content/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-divider">
      <Container className="flex flex-wrap items-start justify-between gap-8 pt-12 pb-8">
        <div className="flex max-w-[380px] flex-col gap-3.5">
          <Logo />
          <p className="text-[15px] leading-[1.6] text-fog">
            Fashion discovery for Pakistan. Browse many brands in one place, then buy on the brand’s own website.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-9 gap-y-4 pt-2">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[15px] text-fog no-underline transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>

      <Container className="flex flex-wrap justify-between gap-3 pb-10 text-[13px] leading-5 text-mist">
        <span>© {new Date().getFullYear()} ClothHub</span>
        <span>Brand names and product photos belong to their owners.</span>
      </Container>
    </footer>
  );
}
