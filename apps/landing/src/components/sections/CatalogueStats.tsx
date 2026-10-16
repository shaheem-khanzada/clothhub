import { Container } from '@/components/ui/Container';
import { catalogue } from '@/content/site';
import { formatApproxCount } from '@/lib/format';

const stats = [
  { value: String(catalogue.brandCount), label: 'Pakistani fashion brands in one place' },
  { value: formatApproxCount(catalogue.productCount), label: 'pieces of lawn, pret, unstitched and couture' },
  { value: formatApproxCount(catalogue.inStockCount), label: 'in stock and ready to order from the brand' },
];

export function CatalogueStats() {
  return (
    <section aria-label="ClothHub in numbers" className="border-y border-divider">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-8 gap-y-2 py-11">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1.5">
            <div className="text-[clamp(44px,4.6vw,64px)] leading-none font-bold tracking-[-0.035em]">{stat.value}</div>
            <div className="text-base leading-[22px] text-fog">{stat.label}</div>
          </div>
        ))}
      </Container>
    </section>
  );
}
