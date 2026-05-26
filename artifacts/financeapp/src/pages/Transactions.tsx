import React, { useState } from "react";
import { Link } from "wouter";
import { Topbar } from "@/components/layout/Topbar";
import { 
  useListTransactions, 
  getListTransactionsQueryKey, 
  useDeleteTransaction,
  useListCategories,
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Transactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState<string>("all");
  const [period, setPeriod] = useState<string>("this_month");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const params: any = { page, limit: 10 };
  if (type !== "all") params.type = type;
  if (period !== "all") params.period = period;
  if (categoryId !== "all") params.categoryId = parseInt(categoryId);
  if (search) params.search = search;

  const { data, isLoading } = useListTransactions(params, { query: { queryKey: getListTransactionsQueryKey(params) } });
  
  const deleteMutation = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Transação excluída com sucesso" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey(params) });
      },
      onError: () => {
        toast({ title: "Erro ao excluir transação", variant: "destructive" });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="bg-[var(--color-background-tertiary)] min-h-[700px] flex flex-col font-sans">
      <Topbar />
      
      <div className="p-8 flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[20px] font-medium text-[var(--color-text-primary)]">Histórico de transações</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">Visualize, filtre e gerencie todas as suas receitas e despesas</p>
          </div>
          <Link href="/transactions/new-expense" className="bg-[#1D9E75] text-white border-none rounded-[var(--border-radius-md)] px-[18px] py-[9px] text-[14px] font-medium cursor-pointer decoration-none">
            + Nova transação
          </Link>
        </div>

        <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-4 flex gap-4 items-center flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px]">Período</span>
            <select value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }} className="text-[13px] px-2.5 py-1.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors">
              <option value="this_month">Este mês</option>
              <option value="last_month">Mês passado</option>
              <option value="last_90_days">Últimos 90 dias</option>
              <option value="all">Todo período</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px]">Tipo</span>
            <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="text-[13px] px-2.5 py-1.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors">
              <option value="all">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px]">Categoria</span>
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1); }} className="text-[13px] px-2.5 py-1.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors">
              <option value="all">Todas</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px]">Buscar</span>
            <input 
              type="text" 
              placeholder="Descrição..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="text-[13px] px-2.5 py-1.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75] transition-colors" 
            />
          </div>
          <div className="flex-1"></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-md)] p-4">
            <p className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] mb-1.5">Total de receitas</p>
            <p className="text-[20px] font-medium text-[#1D9E75]">+ R$ {data?.totalIncome?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
          </div>
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-md)] p-4">
            <p className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] mb-1.5">Total de despesas</p>
            <p className="text-[20px] font-medium text-[#E24B4A]">- R$ {data?.totalExpenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
          </div>
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-md)] p-4">
            <p className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] mb-1.5">Resultado do período</p>
            <p className={`text-[20px] font-medium ${data && data.balance >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
              {data && data.balance >= 0 ? '= R$' : '- R$'} {Math.abs(data?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] overflow-hidden flex flex-col">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-5 py-2.5 bg-[var(--color-background-secondary)] border-b-[0.5px] border-b-[var(--color-border-tertiary)]">
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] font-medium">Descrição</span>
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] font-medium">Data</span>
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] font-medium">Tipo</span>
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] font-medium">Valor</span>
            <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.4px] font-medium">Ações</span>
          </div>

          {isLoading ? (
            <div className="p-8 flex justify-center text-[var(--color-text-secondary)] text-[14px]">Carregando transações...</div>
          ) : data?.transactions?.length === 0 ? (
            <div className="p-8 flex justify-center text-[var(--color-text-secondary)] text-[14px]">Nenhuma transação encontrada.</div>
          ) : (
            data?.transactions?.map((tx, index) => {
              const txDateStr = format(new Date(tx.date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
              const prevTx = index > 0 ? data.transactions[index - 1] : null;
              const showDateHeader = !prevTx || format(new Date(prevTx.date), "yyyy-MM-dd") !== format(new Date(tx.date), "yyyy-MM-dd");

              return (
                <React.Fragment key={tx.id}>
                  {showDateHeader && (
                    <div className="px-5 pt-2 pb-1 text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-background-tertiary)] border-t-[0.5px] border-t-[var(--color-border-tertiary)] mt-[-0.5px]">
                      {txDateStr}
                    </div>
                  )}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] px-5 py-3 border-b-[0.5px] border-b-[var(--color-border-tertiary)] items-center hover:bg-[var(--color-background-secondary)] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[var(--border-radius-md)] flex items-center justify-center text-[14px] shrink-0" style={{ background: tx.categoryColor ? `${tx.categoryColor}33` : '#E1F5EE' }}>
                        {tx.categoryIcon || '💰'}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{tx.description}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: tx.categoryColor ? `${tx.categoryColor}22` : '#E1F5EE', color: tx.categoryColor || '#0F6E56' }}>
                          {tx.categoryName}
                        </span>
                      </div>
                    </div>
                    <span className="text-[13px] text-[var(--color-text-secondary)]">{format(new Date(tx.date), "dd/MM/yyyy")}</span>
                    <span className={`text-[12px] px-2 py-[3px] rounded-full font-medium inline-block w-fit ${tx.type === 'income' ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#FCEBEB] text-[#A32D2D]'}`}>
                      {tx.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                    <span className={`text-[14px] font-medium ${tx.type === 'income' ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="flex gap-1.5">
                      <button className="px-2.5 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] text-[11px] bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors">Editar</button>
                      <button onClick={() => handleDelete(tx.id)} disabled={deleteMutation.isPending} className="px-2.5 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] text-[11px] bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[#FCEBEB] hover:text-[#A32D2D] hover:border-[#FCEBEB] transition-colors disabled:opacity-50">Excluir</button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}

          <div className="flex items-center justify-between px-5 py-3 border-t-[0.5px] border-t-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] mt-auto">
            <span className="text-[13px] text-[var(--color-text-secondary)]">Exibindo {data?.transactions?.length || 0} de {data?.total || 0} transações</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)] text-[13px] cursor-pointer disabled:opacity-50"
              >
                ‹
              </button>
              <button className="px-3 py-1 border-[0.5px] border-[#1D9E75] bg-[#1D9E75] text-white rounded-[var(--border-radius-md)] text-[13px] cursor-pointer">{page}</button>
              <button 
                onClick={() => setPage(p => p + 1)} 
                disabled={!data || data.page * data.limit >= data.total}
                className="px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] rounded-[var(--border-radius-md)] text-[13px] cursor-pointer disabled:opacity-50"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
