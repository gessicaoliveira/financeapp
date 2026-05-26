import React, { useState } from "react";
import { useLocation } from "wouter";
import { Topbar } from "@/components/layout/Topbar";
import { useCreateTransaction, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function NewExpense() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>("Débito");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");

  const createMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Despesa salva com sucesso" });
        queryClient.invalidateQueries();
        setLocation("/transactions");
      },
      onError: (err: any) => {
        toast({ title: "Erro ao salvar despesa", description: err.message || "Verifique os campos obrigatórios", variant: "destructive" });
      }
    }
  });

  const handleSave = () => {
    if (!amount || !description || !date || !categoryId) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        type: "expense",
        amount: parseFloat(amount.replace(',', '.')),
        description,
        date,
        paymentMethod,
        categoryId,
        notes: notes || undefined,
        recurring: false,
      }
    });
  };

  return (
    <div className="bg-[var(--color-background-tertiary)] min-h-[700px] flex flex-col font-sans">
      <Topbar />
      
      <div className="p-8 flex justify-center pb-16">
        <div className="w-full max-w-[580px]">
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
            Transações &rsaquo; <span className="text-[var(--color-text-primary)]">Nova despesa</span>
          </p>

          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-8">
            <p className="text-[18px] font-medium text-[var(--color-text-primary)] mb-1">Cadastrar despesa</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] mb-7">Preencha os dados abaixo para registrar um novo gasto</p>
            <p className="text-[12px] text-[var(--color-text-secondary)] mb-6">Campos com <span className="text-[#E24B4A]">*</span> são obrigatórios</p>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Valor <span className="text-[#E24B4A]">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-[var(--color-text-secondary)] font-medium">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full text-[15px] pl-9 pr-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75] transition-all" 
                />
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Insira o valor total da despesa</p>
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Descrição <span className="text-[#E24B4A]">*</span></label>
              <input 
                type="text" 
                placeholder="Ex: Almoço no restaurante, Conta de luz..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Data <span className="text-[#E24B4A]">*</span></label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors" 
                />
                <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Preenchida com a data de hoje</p>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Método de pagamento</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors cursor-pointer"
                >
                  <option value="Débito">Débito</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>

            <hr className="border-t-[0.5px] border-[var(--color-border-tertiary)] my-6" />

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Categoria <span className="text-[#E24B4A]">*</span></label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {categories?.map(cat => (
                  <div 
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2 border-[0.5px] rounded-[var(--border-radius-md)] text-[12px] cursor-pointer text-center flex flex-col items-center gap-1 transition-all ${categoryId === cat.id ? 'border-2 border-[#E24B4A] bg-[#FCEBEB] text-[#A32D2D] font-medium' : 'border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'}`}
                  >
                    <div className="text-[18px]">{cat.icon}</div>
                    <span className="truncate w-full">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Observações</label>
              <textarea 
                placeholder="Informações adicionais sobre esta despesa (opcional)" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] resize-y min-h-[80px]"
              ></textarea>
            </div>

            <div className="flex gap-3 mt-7">
              <button onClick={() => setLocation('/transactions')} className="flex-1 p-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[15px] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={createMutation.isPending} className="flex-[2] p-2.5 border-none rounded-[var(--border-radius-md)] bg-[#1D9E75] hover:bg-[#168562] text-[15px] text-white font-medium cursor-pointer transition-colors disabled:opacity-50">
                {createMutation.isPending ? 'Salvando...' : 'Salvar despesa'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
