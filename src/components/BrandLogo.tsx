import { siApple, siAsus, siDell, siSamsung, siSony, siVisa, siVodafone } from 'simple-icons';

export type PartnerBrandName = 'Apple' | 'Samsung' | 'Dell' | 'Sony' | 'ASUS' | 'Anker';

interface BrandLogoProps {
  brand: PartnerBrandName;
}

export function BrandLogo({ brand }: BrandLogoProps) {
  switch (brand) {
    case 'Apple':
      return (
        <svg
          role="img"
          aria-label="Apple"
          viewBox="0 0 24 24"
          className="h-8 w-auto fill-[#111111]"
        >
          <title>Apple</title>
          <path d={siApple.path} />
        </svg>
      );

    case 'Samsung':
      return (
        <svg
          role="img"
          aria-label="Samsung"
          viewBox="0 8.8 24 6.4"
          className="h-6 sm:h-7 w-auto fill-[#1428A0]"
        >
          <title>Samsung</title>
          <path d={siSamsung.path} />
        </svg>
      );

    case 'Dell':
      return (
        <svg
          role="img"
          aria-label="Dell"
          viewBox="0 0 24 24"
          className="h-10 w-auto fill-[#007DB8]"
        >
          <title>Dell</title>
          <path d={siDell.path} />
        </svg>
      );

    case 'Sony':
      return (
        <svg
          role="img"
          aria-label="Sony"
          viewBox="0 9.1 24 5.8"
          className="h-5 sm:h-6 w-auto fill-[#111111]"
        >
          <title>Sony</title>
          <path d={siSony.path} />
        </svg>
      );

    case 'ASUS':
      return (
        <svg
          role="img"
          aria-label="ASUS"
          viewBox="0 8.8 24 6.4"
          className="h-5 sm:h-6 w-auto fill-[#00539B]"
        >
          <title>ASUS</title>
          <path d={siAsus.path} />
        </svg>
      );

    case 'Anker':
      return (
        <svg
          role="img"
          aria-label="Anker"
          viewBox="0 0 124 26"
          className="h-5 sm:h-[22px] w-auto fill-[#00A9E0]"
        >
          <title>Anker</title>
          {/* Official-style geometric ANKER wordmark (signature open-A + bold cyan letterforms) */}
          <path d="M1.5 24 L10.8 2 H15.8 L25.1 24 H19.9 L13.3 7.6 L6.7 24 Z" />
          <path d="M29 24 V2 H33.8 L45.2 17.2 V2 H50 V24 H45.2 L33.8 8.8 V24 Z" />
          <path d="M56 24 V2 H60.9 V11.4 L71.2 2 H77.6 L66.6 12.1 L78.2 24 H71.6 L60.9 13.4 V24 Z" />
          <path d="M82 24 V2 H99 V6.3 H86.9 V10.7 H97.4 V15 H86.9 V19.7 H99.4 V24 Z" />
          <path
            fillRule="evenodd"
            d="M104 24 V2 H114.6 C118.9 2 121.6 4.4 121.6 8.4 C121.6 11.4 119.9 13.5 117 14.3 L122.4 24 H116.8 L112 15 H108.9 V24 Z M108.9 10.9 H114.1 C115.8 10.9 116.8 10 116.8 8.5 C116.8 7 115.8 6.2 114.1 6.2 H108.9 Z"
          />
        </svg>
      );
  }
}

export type PaymentMethodBrand =
  | 'mpesa'
  | 'emola'
  | 'visa'
  | 'mastercard'
  | 'millennium'
  | 'bci';

export function PaymentBadgeLogo({ brand }: { brand: PaymentMethodBrand }) {
  switch (brand) {
    case 'mpesa':
      return (
        <span className="inline-flex items-center gap-1.5" aria-label="M-Pesa Vodacom">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#E60000] shrink-0" aria-hidden="true">
            <path d={siVodafone.path} />
          </svg>
          <span className="text-[11px] font-extrabold tracking-tight leading-none whitespace-nowrap">
            <span className="text-[#E60000]">M-</span>
            <span className="text-[#00A651]">Pesa</span>
          </span>
        </span>
      );

    case 'emola':
      return (
        <span className="inline-flex items-center gap-1.5" aria-label="e-Mola Movitel">
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
            <rect width="24" height="24" rx="5" fill="#F36F21" />
            <circle cx="12" cy="12" r="6.5" fill="none" stroke="#FFD100" strokeWidth="2.4" />
            <path d="M12 12H18.5" stroke="#FFD100" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span className="text-[11px] font-extrabold tracking-tight leading-none text-[#F36F21] whitespace-nowrap">
            e-Mola
          </span>
        </span>
      );

    case 'visa':
      return (
        <svg
          role="img"
          aria-label="Visa"
          viewBox="0 7.6 24 8.8"
          className="h-3.5 w-auto fill-[#1A1F71]"
        >
          <title>Visa</title>
          <path d={siVisa.path} />
        </svg>
      );

    case 'mastercard':
      return (
        <span className="inline-flex items-center gap-1" aria-label="Mastercard">
          <svg viewBox="0 0 36 22" className="h-[18px] w-auto shrink-0" aria-hidden="true">
            <circle cx="13" cy="11" r="9.5" fill="#EB001B" />
            <circle cx="23" cy="11" r="9.5" fill="#F79E1B" />
            <path
              d="M18 3.63a9.48 9.48 0 0 0 0 14.74 9.48 9.48 0 0 0 0-14.74z"
              fill="#FF5F00"
            />
          </svg>
        </span>
      );

    case 'millennium':
      return (
        <span className="inline-flex items-center gap-1.5" aria-label="Millennium bim">
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
            <rect width="24" height="24" rx="4" fill="#D1005D" />
            <path
              d="M5 17.5V6.5h2.7l4.3 6.2 4.3-6.2H19v11h-2.5v-6.9L12 17l-4.5-6.4v6.9H5z"
              fill="#FFFFFF"
            />
          </svg>
          <span className="text-[10.5px] font-extrabold tracking-tight leading-none whitespace-nowrap">
            <span className="text-[#222222]">Millennium</span>{' '}
            <span className="text-[#D1005D]">bim</span>
          </span>
        </span>
      );

    case 'bci':
      return (
        <span className="inline-flex items-center gap-1.5" aria-label="BCI">
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
            <rect width="24" height="24" rx="4" fill="#004B9B" />
            <path d="M12 4.2L19.8 12 12 19.8 4.2 12 12 4.2z" fill="#F58220" />
            <path d="M12 7.8L16.2 12 12 16.2 7.8 12 12 7.8z" fill="#FFFFFF" />
          </svg>
          <span className="text-[11px] font-black tracking-wide leading-none text-[#004B9B] whitespace-nowrap">
            BCI
          </span>
        </span>
      );
  }
}

export function AppStoreBadgeIcon({ store }: { store: 'google_play' | 'app_store' }) {
  if (store === 'google_play') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
        <path
          d="M3.61 1.814L13.793 12 3.61 22.186a1.52 1.52 0 0 1-.61-1.22V3.034c0-.508.248-.955.61-1.22z"
          fill="#4285F4"
        />
        <path
          d="M17.27 8.523L13.793 12l3.477 3.477 3.927-2.238c.77-.44.77-2.038 0-2.478l-3.927-2.238z"
          fill="#FBBC04"
        />
        <path
          d="M3.61 1.814c.39-.282.927-.33 1.448-.033l12.212 6.742L13.793 12 3.61 1.814z"
          fill="#34A853"
        />
        <path
          d="M13.793 12l3.477 3.477-12.212 6.742c-.521.297-1.058.249-1.448-.033L13.793 12z"
          fill="#EA4335"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0" aria-hidden="true">
      <path d={siApple.path} />
    </svg>
  );
}

