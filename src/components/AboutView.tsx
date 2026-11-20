import { CheckCircle2, ShieldCheck, Store, Truck } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { MotionButton } from './MotionPrimitives';

export function AboutView() {
  const { navigate, sellers, products } = useMarketplace();
  const activeStoresCount = sellers.filter((s) => s.status === 'active').length;

  return (
    <main className="bg-white pb-16">
      <div className="max-w-[1170px] mx-auto px-4 pt-6 space-y-8">
        {/* Static Institutional Banner (zero hover animations) */}
        <section className="cellbox-hero-gradient text-white rounded-[3px] px-6 sm:px-10 py-10">
          <p className="font-condensed text-xs sm:text-sm uppercase tracking-widest text-[#B7EBF2] font-semibold">
            SOBRE A CELLBOX MOÇAMBIQUE
          </p>
          <h1 className="font-condensed text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-tight mt-1.5 max-w-2xl">
            TECNOLOGIA VERIFICADA COM GARANTIA NACIONAL
          </h1>
          <p className="text-sm text-white/90 mt-3 max-w-2xl leading-relaxed">
            A Cellbox é o marketplace especializado em smartphones, laptops, tablets, áudio e
            acessórios de alto desempenho em Moçambique, ligando compradores diretamente a lojas
            oficiais auditadas.
          </p>
        </section>

        {/* Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-6 space-y-2.5">
            <ShieldCheck className="w-7 h-7 text-[#0475EE]" />
            <h2 className="font-condensed text-lg font-bold uppercase text-[#0A3768]">
              Compra Garantida
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              Todos os pedidos contam com proteção financeira até a entrega confirmada e política
              de devolução facilitada em até 30 dias.
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-6 space-y-2.5">
            <Store className="w-7 h-7 text-[#18A3DE]" />
            <h2 className="font-condensed text-lg font-bold uppercase text-[#0A3768]">
              Lojas Oficiais Verificadas
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              Atualmente com {activeStoresCount} lojas parceiras verificadas e {products.length}{' '}
              produtos de tecnologia com procedência e garantia em Meticais (MT).
            </p>
          </div>
          <div className="bg-[#F8FAFC] border border-[#EAEAEA] rounded-[3px] p-6 space-y-2.5">
            <Truck className="w-7 h-7 text-[#0A3768]" />
            <h2 className="font-condensed text-lg font-bold uppercase text-[#0A3768]">
              Entrega em Todo Moçambique
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed">
              Envio rastreável para Maputo, Matola, Beira, Nampula e todas as províncias, com
              pagamento via M-Pesa, e-Mola, cartões ou transferência bancária.
            </p>
          </div>
        </section>

        {/* Commitment & CTA */}
        <section className="bg-white border border-[#EAEAEA] rounded-[3px] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-condensed text-2xl font-bold uppercase text-[#0A3768]">
              Compromisso com Transparência e Qualidade
            </h2>
            <ul className="space-y-1.5 text-xs text-[#555555]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0475EE] shrink-0" />
                Inspeção técnica de 40 pontos em todos os aparelhos recondicionados A+.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0475EE] shrink-0" />
                Preços transparentes em Meticais de Moçambique (MZN / MT).
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0475EE] shrink-0" />
                Atendimento local dedicado por telefone, WhatsApp e e-mail.
              </li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'home' })}
              className="h-10 px-6 rounded-full bg-[#0475EE] hover:bg-[#0A3768] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Explorar Vitrine
            </MotionButton>
            <MotionButton
              type="button"
              onClick={() => navigate({ type: 'contact' })}
              className="h-10 px-6 rounded-full border border-[#DCDCDC] hover:border-[#0475EE] text-[#0A3768] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Falar Connosco
            </MotionButton>
          </div>
        </section>
      </div>
    </main>
  );
}
