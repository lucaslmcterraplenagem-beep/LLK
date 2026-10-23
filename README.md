# LK Pneus – Gestão de Pneus da Frota

Sistema web de gestão de pneus para frotas (caminhões, carretas, agrícolas etc.).

- Login por conta (Supabase Auth)
- Cada usuário vê **somente os seus dados** (Row Level Security)
- Tabelas separadas no Supabase: veículos, pneus, motoristas, fornecedores, ordens de serviço e auditoria
- Mapa visual de eixos / posições de pneus
- Dashboard com sulco (alerta / crítico), gastos e estoque
- Toda ação grava na tabela correspondente + linha em `auditoria`

## Como colocar no ar

1. Execute **uma vez** o arquivo `supabase-setup.sql` no **SQL Editor** do Supabase.
2. Crie um usuário em **Authentication → Users** (e-mail + senha).
3. Sirva os arquivos estáticos (GitHub Pages ou qualquer servidor HTTP).
4. Abra o site, faça login e use o sistema.

## Configuração Supabase

Em `js/state.js`:

```js
const SUPABASE_URL = 'https://ggtzcxcjgzueuakoflzm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
