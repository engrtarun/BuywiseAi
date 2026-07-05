ALTER TABLE public.chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.chat_sessions(id) 
ON DELETE CASCADE;
