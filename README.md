This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## v3: 여러 풍선 만들기와 관리 링크

- 만드는 사람은 태명·예정일·성별을 한 번 입력하고 받는 사람을 최대 10명까지 추가해 풍선을 한 번에 만든다.
- 생성 후 `/gender-reveal/manage/{관리 코드}` 관리 화면에서 받는 사람별 공유 링크 복사, 삭제(댓글 포함), 풍선별 1회 7일 연장을 할 수 있다.
- 로그인이 없으므로 관리 링크가 곧 관리 권한이다. 관리 코드는 받는 사람용 화면·API에 노출되지 않는다.
- 필요한 DB 변경: `supabase/migrations/0005_event_code_and_extension.sql`, `0006_events_anon_update_delete_policies.sql`
- 상세 설계: `specs/004-multi-balloon-management/`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Copyright

© 2026 comeOnBaby. All rights reserved.
