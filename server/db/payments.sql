-- 充值订单表（聚合支付：虎皮椒 微信/支付宝）
-- 在 Supabase SQL Editor 里执行一次即可。
create table if not exists recharge_orders (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  package_id text not null,
  credits int not null,              -- 到账积分(含赠送)
  amount_yuan numeric(10,2) not null,
  channel text not null,             -- wechat | alipay
  status text not null default 'pending',  -- pending | paid | failed
  transaction_id text,               -- 通道側交易号
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists idx_recharge_orders_email on recharge_orders(user_email);
create index if not exists idx_recharge_orders_status on recharge_orders(status);
