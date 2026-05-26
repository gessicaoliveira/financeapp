import { Link, useLocation } from "wouter";

export function Topbar() {
  const [location] = useLocation();
  
  return (
    <div className="bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)] px-8 h-14 flex items-center justify-between">
      <div className="text-[18px] font-medium text-[#1D9E75]">FinanceApp</div>
      <div className="flex gap-8 items-center">
        <Link 
          href="/" 
          className={`text-[14px] py-1 text-decoration-none ${location === "/" ? "text-[#1D9E75] border-b-2 border-[#1D9E75] font-medium" : "text-[var(--color-text-secondary)]"}`}
        >
          Dashboard
        </Link>
        <Link 
          href="/transactions" 
          className={`text-[14px] py-1 text-decoration-none ${location.startsWith("/transactions") ? "text-[#1D9E75] border-b-2 border-[#1D9E75] font-medium" : "text-[var(--color-text-secondary)]"}`}
        >
          Transações
        </Link>
        <Link 
          href="/categories" 
          className={`text-[14px] py-1 text-decoration-none ${location === "/categories" ? "text-[#1D9E75] border-b-2 border-[#1D9E75] font-medium" : "text-[var(--color-text-secondary)]"}`}
        >
          Categorias
        </Link>
        <Link 
          href="/reports" 
          className={`text-[14px] py-1 text-decoration-none ${location === "/reports" ? "text-[#1D9E75] border-b-2 border-[#1D9E75] font-medium" : "text-[var(--color-text-secondary)]"}`}
        >
          Relatórios
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[var(--color-text-secondary)]">Ana Souza</span>
        <div className="w-8 h-8 rounded-full bg-[#E1F5EE] flex items-center justify-center text-[12px] font-medium text-[#0F6E56]">AS</div>
      </div>
    </div>
  );
}
