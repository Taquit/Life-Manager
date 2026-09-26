-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Category (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text,
  color text,
  icon text,
  CONSTRAINT Category_pkey PRIMARY KEY (id),
  CONSTRAINT Category_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.Card (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  alias text,
  banco text NOT NULL,
  type text,
  last_4 character varying(4),
  color text,
  linked_google boolean DEFAULT false,
  cut_day integer,
  pay_day integer,
  CONSTRAINT Card_pkey PRIMARY KEY (id),
  CONSTRAINT Card_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.Service (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  category_id bigint,
  name text NOT NULL,
  amount numeric NOT NULL,
  due_date date,
  state text,
  pay_day integer,
  CONSTRAINT Service_pkey PRIMARY KEY (id),
  CONSTRAINT Service_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT Service_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.Category(id)
);
CREATE TABLE public.Transaction (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  category_id bigint,
  user_id uuid NOT NULL,
  card_id bigint,
  type text,
  amount numeric NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  note text,
  origin text,
  CONSTRAINT Transaction_pkey PRIMARY KEY (id),
  CONSTRAINT Transaction_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.Category(id),
  CONSTRAINT Transaction_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT Transaction_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.Card(id)
);