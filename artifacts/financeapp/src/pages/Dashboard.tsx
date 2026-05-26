import React from "react";
import { Link, useLocation } from "wouter";
import { Topbar } from "@/components/layout/Topbar";
import { 
  useGetDashboardSummary, 
  useGetRecentTransactions, 
  useGetCategoryBreakdown, 
  getGetDashboardSummaryQueryKey, 
  getGetRecentTransactionsQueryKey, 
  getGetCategoryBreakdownQueryKey 
} from "@workspace/api-client-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useGetRecentTransactions({ query: { queryKey: getGetRecentTransactionsQueryKey() } });
  const { data: categoryBreakdown, isLoading: isLoadingBreakdown } = useGetCategoryBreakdown({ query: { queryKey: getGetCategoryBreakdownQueryKey() } });

  return (
    <div className="bg-[var(--color-background-tertiary)] min-h-[700px] flex flex-col font-sans pb-16">
      <Topbar />

      <div className="p-8 flex flex-col gap-6">
        <div>
          <p className="text-[20px] font-medium text-[var(--color-text-primary)]">
            Bom dia, Ana
            <span className="text-[14px] font-normal text-[var(--color-text-secondary)] block mt-0.5">Aqui está um resumo da sua situação financeira em {summary?.month || 'este mês'}</span>
          </p>
        </div>

        {!isLoadingSummary && summary && (
          <div className={`rounded-[var(--border-radius-md)] py-2.5 px-4 flex items-center gap-2.5 mb-0 ${summary.withinLimit ? 'bg-[#E1F5EE]' : 'bg-[#FCEBEB]'}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${summary.withinLimit ? 'bg-[#1D9E75]' : 'bg-[#E24B4A]'}`}></div>
            <p className={`text-[13px] ${summary.withinLimit ? 'text-[#0F6E56]' : 'text-[#A32D2D]'}`}>
              {summary.withinLimit ? 'Você está dentro do limite de gastos este mês. Continue assim!' : 'Atenção! Suas despesas ultrapassaram suas receitas este mês.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-5 border-l-4 border-l-[#1D9E75]">
            <p className="text-[12px] text-[var(--color-text-secondary)] mb-2 uppercase tracking-[0.5px]">Saldo atual</p>
            {isLoadingSummary ? (
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            ) : (
              <p className={`text-[28px] font-medium ${summary && summary.balance >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                R$ {summary?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </p>
            )}
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Atualizado agora</p>
          </div>
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-5 border-l-4 border-l-[var(--color-border-tertiary)]">
            <p className="text-[12px] text-[var(--color-text-secondary)] mb-2 uppercase tracking-[0.5px]">Total de receitas</p>
            {isLoadingSummary ? (
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            ) : (
              <p className="text-[28px] font-medium text-[var(--color-text-primary)]">
                R$ {summary?.totalIncome?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </p>
            )}
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Este mês</p>
          </div>
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-5 border-l-4 border-l-[#E24B4A]">
            <p className="text-[12px] text-[var(--color-text-secondary)] mb-2 uppercase tracking-[0.5px]">Total de despesas</p>
            {isLoadingSummary ? (
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            ) : (
              <p className="text-[28px] font-medium text-[#E24B4A]">
                R$ {summary?.totalExpenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </p>
            )}
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Este mês</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-start">
          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[15px] font-medium text-[var(--color-text-primary)]">Transações recentes</p>
              <Link href="/transactions" className="text-[13px] text-[#1D9E75] cursor-pointer hover:underline decoration-none">ver todas</Link>
            </div>
            
            <div className="flex flex-col">
              {isLoadingTransactions ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b-[0.5px] border-b-[var(--color-border-tertiary)] last:border-b-0">
                    <div className="w-9 h-9 rounded-[var(--border-radius-md)] bg-gray-200 animate-pulse shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : recentTransactions?.length === 0 ? (
                <div className="py-6 text-center text-[14px] text-[var(--color-text-secondary)]">Nenhuma transação recente</div>
              ) : (
                recentTransactions?.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b-[0.5px] border-b-[var(--color-border-tertiary)] last:border-b-0">
                    <div className="w-9 h-9 rounded-[var(--border-radius-md)] flex items-center justify-center text-[16px] shrink-0" style={{ background: tx.categoryColor ? `${tx.categoryColor}33` : '#E1F5EE' }}>
                      {tx.categoryIcon || '💰'}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">{tx.description}</p>
                      <p className="text-[12px] text-[var(--color-text-secondary)] truncate">{format(new Date(tx.date), "dd/MM/yyyy")} · {tx.categoryName}</p>
                    </div>
                    <p className={`text-[14px] font-medium shrink-0 ${tx.type === 'income' ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[15px] font-medium text-[var(--color-text-primary)]">Gastos por categoria</p>
              <span className="text-[13px] text-[#1D9E75]">{summary?.month || 'este mês'}</span>
            </div>
            
            <div className="flex flex-col">
              {isLoadingBreakdown ? (
                 [1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-2.5 mb-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-2 bg-gray-100 rounded w-full overflow-hidden"><div className="h-full bg-gray-200 animate-pulse w-1/2"></div></div>
                    </div>
                  </div>
                 ))
              ) : categoryBreakdown?.length === 0 ? (
                <div className="py-6 text-center text-[14px] text-[var(--color-text-secondary)]">Sem dados de gastos</div>
              ) : (
                categoryBreakdown?.map(cat => (
                  <div key={cat.categoryId} className="flex items-center gap-2.5 mb-3 last:mb-0">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[13px] text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <span>{cat.categoryIcon}</span> {cat.categoryName}
                        </p>
                        <p className="text-[12px] text-[var(--color-text-secondary)]">R$ {cat.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                      <div className="bg-[var(--color-background-secondary)] rounded bg-gray-100 h-2 overflow-hidden">
                        <div className="h-2 rounded transition-all duration-500 ease-out" style={{ width: `${cat.percentage}%`, background: cat.categoryColor || '#1D9E75' }}></div>
                      </div>
                    </div>
                    <p className="text-[12px] font-medium text-[var(--color-text-secondary)] whitespace-nowrap w-[32px] text-right">{Math.round(cat.percentage)}%</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
