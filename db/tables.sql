CREATE TABLE IF NOT EXISTS public.users
(
    id bigint NOT NULL,
    username text COLLATE pg_catalog."default",
    name text COLLATE pg_catalog."default",
    is_admin boolean NOT NULL DEFAULT false,
    is_notifications boolean,
    CONSTRAINT users_pkey PRIMARY KEY (id)
)

CREATE TABLE IF NOT EXISTS public.history
(
    user_id bigint NOT NULL,
    reason text COLLATE pg_catalog."default",
    date timestamp with time zone NOT NULL,
    CONSTRAINT user_id_fk FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

