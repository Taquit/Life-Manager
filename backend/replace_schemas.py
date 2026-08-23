import re

def replace_schema(filepath, new_schema):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # regex to find CREATE TABLE ... ;
    new_content = re.sub(r'CREATE TABLE IF NOT EXISTS \w+ \([^;]+\);', new_schema, content, flags=re.MULTILINE|re.DOTALL)
    if new_content == content:
        # maybe it doesn't match perfectly, let's try a broader one
        new_content = re.sub(r'CREATE TABLE IF NOT EXISTS[^{]*?\);', new_schema, content, flags=re.MULTILINE|re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(new_content)

users_schema = """CREATE TABLE IF NOT EXISTS public.users (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            name text NOT NULL,
            email text NOT NULL UNIQUE,
            password text NOT NULL,
            CONSTRAINT users_pkey PRIMARY KEY (id)
        );"""

card_schema = """CREATE TABLE IF NOT EXISTS public.card (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                bankname text NOT NULL,
                alias text NOT NULL,
                last4 text NOT NULL,
                user_id uuid NOT NULL,
                CONSTRAINT card_pkey PRIMARY KEY (id),
                CONSTRAINT fk_card_user FOREIGN KEY (user_id) REFERENCES public.users(id)
            );"""

category_schema = """CREATE TABLE IF NOT EXISTS public.category (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                name text NOT NULL,
                color text NOT NULL,
                user_id uuid NOT NULL,
                CONSTRAINT category_pkey PRIMARY KEY (id),
                CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES public.users(id)
            );"""

transactions_schema = """CREATE TABLE IF NOT EXISTS public.transactions (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                title text NOT NULL,
                amount numeric NOT NULL,
                category_id uuid,
                is_auto boolean DEFAULT false,
                card_id uuid,
                user_id uuid,
                date timestamp without time zone DEFAULT now(),
                CONSTRAINT transactions_pkey PRIMARY KEY (id),
                CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES public.users(id),
                CONSTRAINT fk_transactions_card FOREIGN KEY (card_id) REFERENCES public.card(id),
                CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES public.category(id)
            );"""

replace_schema('src/user/create.ts', users_schema)
replace_schema('src/card/create.ts', card_schema)
replace_schema('src/category/create.ts', category_schema)
replace_schema('src/transactions/create.ts', transactions_schema)
