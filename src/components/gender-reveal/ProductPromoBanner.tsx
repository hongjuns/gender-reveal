import Image from 'next/image';

export const PRODUCT_PROMO_URL = 'https://smartstore.naver.com/poon_poon/products/10899236424';

interface ProductPromoBannerProps {
  babyNickname: string;
}

// Figma 258-214 상단 배너: 누르면 보조배터리 상품 페이지를 새 창으로 연다.
export function ProductPromoBanner({ babyNickname }: ProductPromoBannerProps) {
  return (
    <a
      href={PRODUCT_PROMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex h-[60px] w-full items-center overflow-hidden rounded-[10px] bg-ink pl-5 pr-[111px] no-underline"
    >
      <p className="m-0 truncate text-sm font-bold leading-normal tracking-[-0.7px] text-white">
        {babyNickname}만의 <span className="text-[#faa3af]">특별한 보조배터리</span> 만들기 🎈
      </p>
      <Image
        src="/img/share/battery-banner.png"
        alt=""
        width={75}
        height={38}
        className="absolute right-[36px] top-[11px]"
      />
    </a>
  );
}
