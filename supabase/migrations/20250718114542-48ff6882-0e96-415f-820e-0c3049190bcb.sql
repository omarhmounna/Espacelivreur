-- Add DELETE policy for archived_orders table so users can delete their own archived orders
CREATE POLICY "Users can delete their own archived orders" 
ON public.archived_orders 
FOR DELETE 
USING (auth.uid() = user_id);