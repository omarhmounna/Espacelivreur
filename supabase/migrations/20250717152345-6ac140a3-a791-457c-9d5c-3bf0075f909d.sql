-- Create orders table for persistent data storage
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  vendeur TEXT NOT NULL,
  numero TEXT NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'Nouveau',
  commentaire TEXT DEFAULT '',
  is_scanned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" 
ON public.orders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create archived orders table
CREATE TABLE public.archived_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  vendeur TEXT NOT NULL,
  numero TEXT NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  statut TEXT NOT NULL,
  commentaire TEXT DEFAULT '',
  is_scanned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for archived orders
ALTER TABLE public.archived_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for archived orders
CREATE POLICY "Users can view their own archived orders" 
ON public.archived_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own archived orders" 
ON public.archived_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on archived orders
CREATE TRIGGER update_archived_orders_updated_at
BEFORE UPDATE ON public.archived_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();