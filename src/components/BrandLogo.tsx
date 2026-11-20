import { siApple, siAsus, siDell, siSamsung, siSony } from 'simple-icons';

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
