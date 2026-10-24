# Ki?n trúc Frontend SESS-CTUT

## T?ng quan
Frontend du?c xây d?ng theo ki?n trúc Domain-Oriented Modular Architecture k?t h?p Layered Architecture, s? d?ng Vue 3, Vite, Pinia, Vue Router và Tailwind CSS.

## C?u trúc thu m?c th?c t?

`
frontend/
+-- docs/
¦   +-- FRONTEND_ARCHITECTURE.md
+-- public/
¦   +-- assets/
¦       +-- branding/
+-- src/
¦   +-- app/
¦   ¦   +-- layouts/        # Layouts chung c?a app
¦   ¦   +-- router/         # C?u hình router
¦   ¦   +-- providers/      # Providers (plugins)
¦   +-- assets/
¦   ¦   +-- images/
¦   ¦   +-- styles/
¦   +-- components/
¦   ¦   +-- ui/             # UI primitives (BaseButton, BaseInput, ...)
¦   ¦   +-- common/         # Shared business-neutral components
¦   ¦   +-- forms/          # Form components
¦   ¦   +-- data-display/   # Table, Card, DataTable, ...
¦   ¦   +-- feedback/       # Modal, Toast, Alert, ...
¦   +-- layouts/            # Role-based layouts (Public, Auth, Student, Advisor, Judge, Admin)
¦   +-- modules/            # Modules nghi?p v? theo domain
¦   ¦   +-- auth/
¦   ¦   +-- competitions/
¦   ¦   +-- projects/
¦   ¦   +-- teams/
¦   ¦   +-- mentoring/
¦   ¦   +-- judging/
¦   ¦   +-- notifications/
¦   ¦   +-- news/
¦   ¦   +-- administration/
¦   ¦   +-- public-site/
¦   +-- services/
¦   ¦   +-- http/           # HTTP client (axios)
¦   ¦   +-- api/            # API adapters theo module
¦   +-- stores/             # Pinia stores
¦   +-- composables/        # Composables dùng chung
¦   +-- utils/              # Utilities
¦   +-- constants/          # Constants
¦   +-- App.vue
¦   +-- main.js
`

## Phân vùng theo role

- **Public site** (modules/public-site/ + PublicLayout.vue): Trang công khai (home, news, competitions)
- **Auth** (modules/auth/ + AuthLayout.vue): Ðang nh?p, xác th?c OTP, Google OAuth
- **Student** (modules/competitions/, modules/projects/, modules/teams/ + StudentLayout.vue): Khu v?c sinh viên
- **Advisor/Mentor** (modules/mentoring/ + AdvisorLayout.vue): Khu v?c gi?ng viên c? v?n
- **Judge** (modules/judging/ + JudgeLayout.vue): Khu v?c ban giám kh?o
- **Admin** (modules/administration/ + AdminLayout.vue): Khu v?c qu?n tr?

## Nguyên t?c

- M?i module có pages/, components/, services/, composables/, utils/, constants/ khi c?n thi?t
- Components dùng chung d?t trong components/ theo phân lo?i (ui/common/forms/data-display/feedback)
- Components d?c thù c?a module d?t trong module dó
- Layouts theo role d?t trong src/layouts/ v?i sidebar/menu riêng bi?t
- Route guards ki?m tra authentication và role-based access
- API client dùng chung t?i services/http/httpClient.js
- State management v?i Pinia t?i stores/

## Quy t?c tìm ki?m nhanh

- **Trang/Screens**: modules/<domain>/pages/ ho?c src/layouts/ cho layout
- **Components dùng chung**: src/components/ui/, src/components/common/
- **Components d?c thù**: modules/<domain>/components/
- **API calls**: services/api/ ho?c modules/<domain>/services/
- **Routes**: pp/router/
- **State**: stores/
- **Auth/Roles**: stores/auth.js, route meta.roles
