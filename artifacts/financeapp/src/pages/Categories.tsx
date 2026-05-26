import React, { useState } from "react";
import { Link } from "wouter";
import { Topbar } from "@/components/layout/Topbar";
import { 
  useListCategories, 
  getListCategoriesQueryKey, 
  useCreateCategory, 
  useDeleteCategory 
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const EMOJIS = ["🏋️", "🐾", "✈️", "🎵", "🛍️", "🔧", "📦", "💻", "🎂", "🌿", "⚽", "🏷️"];
const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#D4537E", "#EF9F27", "#E24B4A", "#639922", "#888780"];

export default function Categories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);

  const createMutation = useCreateCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Categoria criada com sucesso!" });
        setName("");
        setIcon(EMOJIS[0]);
        setColor(COLORS[0]);
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Erro ao criar categoria", description: err.message, variant: "destructive" });
      }
    }
  });

  const deleteMutation = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        toast({ title: "Categoria excluída com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Erro ao excluir categoria", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast({ title: "Informe um nome para a categoria", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      data: { name: name.trim(), icon, color }
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="bg-[var(--color-background-tertiary)] min-h-[700px] flex flex-col font-sans">
      <Topbar />
      
      <div className="p-8 flex flex-col gap-5 pb-16">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[20px] font-medium text-[var(--color-text-primary)]">Categorias</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">Gerencie e personalize as categorias das suas transações</p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-[0.4px] mb-2.5">Todas as Categorias</p>
            {isLoading ? (
               <div className="text-[14px] text-[var(--color-text-secondary)]">Carregando categorias...</div>
            ) : (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-2.5 mb-6">
                {categories?.map(cat => (
                  <div key={cat.id} className={`bg-[var(--color-background-primary)] border-[0.5px] rounded-[var(--border-radius-lg)] p-4 flex flex-col items-start gap-1.5 ${!cat.isDefault ? 'border-dashed border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)]' : 'border-[var(--color-border-tertiary)]'}`}>
                    <div className="w-10 h-10 rounded-[var(--border-radius-md)] flex items-center justify-center text-[20px] mb-1 shrink-0" style={{ background: !cat.isDefault ? 'var(--color-background-primary)' : (cat.color ? `${cat.color}33` : '#E1F5EE') }}>
                      {cat.icon}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full mt-0.5 ${cat.isDefault ? 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]' : 'bg-[#E1F5EE] text-[#0F6E56]'}`}>
                      {cat.isDefault ? 'Padrão' : 'Personalizada'}
                    </span>
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate w-full">{cat.name}</p>
                    <p className="text-[12px] text-[var(--color-text-secondary)]">{cat.transactionCount} transações</p>
                    <p className={`text-[13px] font-medium ${cat.totalAmount >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                      {cat.totalAmount >= 0 ? '+' : '-'} R$ {Math.abs(cat.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex gap-1.5 mt-1 w-full">
                      <button className="flex-1 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] text-[11px] bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors">Editar</button>
                      {!cat.isDefault && (
                        <button onClick={() => handleDelete(cat.id)} disabled={deleteMutation.isPending} className="flex-1 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] text-[11px] bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[#FCEBEB] hover:text-[#A32D2D] hover:border-[#FCEBEB] transition-colors disabled:opacity-50">Excluir</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky top-8">
            <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[var(--border-radius-lg)] p-6">
              <p className="text-[15px] font-medium text-[var(--color-text-primary)] mb-5">Nova categoria personalizada</p>

              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Nome da categoria</label>
                <input 
                  type="text" 
                  placeholder="Ex: Academia, Pets, Assinaturas..." 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-[14px] px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-[var(--border-radius-md)] bg-[var(--color-background-primary)] text-[var(--color-text-primary)] outline-none focus:border-[#1D9E75]" 
                />
              </div>

              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Ícone</label>
                <div className="grid grid-cols-6 gap-1.5 mt-1">
                  {EMOJIS.map(e => (
                    <div 
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`w-9 h-9 rounded-[var(--border-radius-md)] flex items-center justify-center text-[16px] cursor-pointer transition-all ${icon === e ? 'border-2 border-[#1D9E75] bg-[#E1F5EE]' : 'border-[0.5px] border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] hover:bg-[var(--color-background-secondary)]'}`}
                    >
                      {e}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Cor de identificação</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {COLORS.map(c => (
                    <div 
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${color === c ? 'border-[var(--color-text-primary)]' : 'border-transparent hover:scale-110'}`}
                      style={{ background: c }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--color-background-secondary)] rounded-[var(--border-radius-md)] p-3 flex items-center gap-2.5 my-4">
                <div className="w-10 h-10 rounded-[var(--border-radius-md)] flex items-center justify-center text-[20px] shrink-0" style={{ background: `${color}33` }}>
                  {icon}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">{name || "Categoria"}</p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">Categoria personalizada</p>
                </div>
              </div>

              <hr className="border-t-[0.5px] border-[var(--color-border-tertiary)] my-4" />

              <button 
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full py-2.5 border-none rounded-[var(--border-radius-md)] bg-[#1D9E75] hover:bg-[#168562] text-[14px] text-white font-medium cursor-pointer transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Criando...' : 'Criar categoria'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
