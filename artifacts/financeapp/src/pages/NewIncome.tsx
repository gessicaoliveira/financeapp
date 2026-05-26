import React, { useState } from "react";
import { useLocation } from "wouter";
import { Topbar } from "@/components/layout/Topbar";
import { useCreateTransaction, useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function NewIncome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });

  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [account, setAccount] = useState<string>("Nubank");
  const [recurring, setRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<string>("mensal");
  const [notes, setNotes] = useState<string>("");

  const createMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Receita salva com sucesso" });
        queryClient.invalidateQueries();
        setLocation("/transactions");
      },
      onError: (err: any) => {
        toast({ title: "Erro ao salvar receita", description: err.message || "Verifique os campos obrigatórios", variant: "destructive" });
      }
    }
  });

  const handleSave = () => {
    if (!amount || !description || !origin || !date) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        type: "income",
        amount: parseFloat(amount.replace(',', '.')),
        description,
        origin,
        date,
        account,
        notes: notes || undefined,
        recurring,
        recurringFrequency: recurring ? recurringFrequency : undefined,
      }
    });
  };

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const currentBalance = summary?.balance || 0;
  const newBalance = currentBalance + parsedAmount;

  return (
    <div className="bg-[var(--color-background-tertiary)] min-h-[700px] flex flex-col font-sans">
      <Topbar />
      
      <div className="p-8 flex gap-6 items-start justify-center pb-16">
        <div className="flex-1 max-w-[580px]">
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
            Transações &rsaquo; <span className="text-[var(--color-text-primary)]">Nova receita</span>
          </p>

          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-7">
            <p className="text-[18px] font-medium text-[var(--color-text-primary)] mb-1">Cadastrar receita</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">Registre uma nova entrada de dinheiro na sua conta</p>

            <div className="grid grid-cols-2 gap-0 mb-6 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] overflow-hidden">
              <div className="p-2.5 text-[14px] text-center cursor-pointer border-none bg-[#EAF3DE] text-[#3B6D11] font-medium">Receita</div>
              <div onClick={() => setLocation('/transactions/new-expense')} className="p-2.5 text-[14px] text-center cursor-pointer border-none bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)] transition-colors">Despesa</div>
            </div>

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
                  className="w-full text-[15px] pl-9 pr-3 py-2.5 border-[1.5px] border-[#1D9E75] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:ring-1 focus:ring-[#1D9E75]" 
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Descrição <span className="text-[#E24B4A]">*</span></label>
              <input 
                type="text" 
                placeholder="Ex: Salário, Venda, Freelance..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors" 
              />
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Origem da receita <span className="text-[#E24B4A]">*</span></label>
              <input 
                type="text" 
                placeholder="Ex: Salário, Trabalho Extra, Presente..." 
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors" 
              />
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Campo livre — escreva como preferir</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Data <span className="text-[#E24B4A]">*</span></label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors cursor-pointer" 
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Conta / banco</label>
                <select 
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors cursor-pointer"
                >
                  <option value="Nubank">Nubank</option>
                  <option value="Itaú">Itaú</option>
                  <option value="Bradesco">Bradesco</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <hr className="border-t-[0.5px] border-[var(--color-border-tertiary)] my-5" />

            <div className="bg-[var(--color-background-secondary)] rounded-[var(--border-radius-md)] p-3 mb-5">
              <p className="text-[13px] font-medium text-[var(--color-text-primary)] mb-2">Recorrência</p>
              <div className="flex items-center gap-2 mb-1.5">
                <input 
                  type="checkbox" 
                  id="rec" 
                  checked={recurring}
                  onChange={e => setRecurring(e.target.checked)}
                  className="w-4 h-4 cursor-pointer" 
                />
                <label htmlFor="rec" className="text-[13px] text-[var(--color-text-secondary)] cursor-pointer select-none">Esta receita se repete todo mês</label>
              </div>
              {recurring && (
                <div className="mt-3">
                  <select 
                    value={recurringFrequency}
                    onChange={e => setRecurringFrequency(e.target.value)}
                    className="w-full text-[13px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none cursor-pointer"
                  >
                    <option value="mensal">Todo mês (mensal)</option>
                    <option value="semanal">A cada semana</option>
                    <option value="quinzenal">A cada 15 dias</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Observações</label>
              <textarea 
                placeholder="Informações adicionais (opcional)" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-[15px] px-3 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] min-h-[60px] outline-none focus:border-[#1D9E75] resize-y"
              ></textarea>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setLocation('/transactions')} className="flex-1 p-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[15px] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={createMutation.isPending} className="flex-[2] p-2.5 border-none rounded-[var(--border-radius-md)] bg-[#1D9E75] hover:bg-[#168562] text-[15px] text-white font-medium cursor-pointer transition-colors disabled:opacity-50">
                {createMutation.isPending ? 'Salvando...' : 'Salvar receita'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-[240px] shrink-0 sticky top-8">
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-5">
            <p className="text-[13px] font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-[0.4px]">Pré-visualização</p>
            <p className="text-[28px] font-medium text-[#1D9E75] mb-1">
              + R$ {parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[14px] text-[var(--color-text-primary)] mb-0.5 break-words">{description || 'Descrição'}</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">{date ? format(new Date(date), 'dd/MM/yyyy') : '--/--/----'} · {account || 'Conta'}</p>
            {recurring && (
              <span className="inline-block mt-2 text-[12px] px-2.5 py-1 rounded-full bg-[#EAF3DE] text-[#3B6D11] font-medium">Receita {recurringFrequency}</span>
            )}
            
            <hr className="border-t-[0.5px] border-[var(--color-border-tertiary)] my-3" />
            
            <p className="text-[12px] text-[var(--color-text-secondary)] mb-1">Saldo atual</p>
            <p className="text-[14px] font-medium text-[var(--color-text-secondary)]">R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-2 mb-1">Novo saldo após salvar</p>
            <p className="text-[16px] font-medium text-[#1D9E75]">R$ {newBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            
            <div className="bg-[#E1F5EE] rounded-[var(--border-radius-md)] p-2.5 mt-4">
              <p className="text-[12px] text-[#0F6E56] leading-relaxed">O saldo será atualizado em tempo real após o salvamento da receita.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
