"""
Gerador de Diagramas - Modelo Lógico e Físico
Sistema Fintech - Controle Financeiro
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Image, Spacer, Paragraph, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
import os

# ─────────────────────────────────────────────
# Cores do tema
# ─────────────────────────────────────────────
C_PRIMARY    = "#1A56DB"   # azul
C_SECONDARY  = "#3F83F8"   # azul claro
C_ACCENT     = "#E1EFFE"   # azul muito claro (fundo entidade)
C_HEADER     = "#1E429F"   # azul escuro (cabeçalho)
C_PK         = "#FEF3C7"   # amarelo claro (PK)
C_FK         = "#D1FAE5"   # verde claro (FK)
C_REL        = "#E5E7EB"   # cinza claro (relacionamento)
C_TEXT_DARK  = "#111827"
C_TEXT_MID   = "#374151"
C_TEXT_LIGHT = "#6B7280"
C_WHITE      = "#FFFFFF"
C_LINE       = "#9CA3AF"
C_BORDER     = "#2563EB"

# ─────────────────────────────────────────────
# Dados do Modelo Lógico
# ─────────────────────────────────────────────

ENTITIES = {
    "USUARIO": {
        "attrs": [
            ("PK", "id_usuario",            "Identificador único do usuário"),
            ("",   "nome",                  "Nome completo"),
            ("",   "email",                 "Endereço de e-mail (único)"),
            ("",   "senha_hash",            "Hash da senha"),
            ("",   "data_cadastro",         "Data de criação da conta"),
        ],
        "color": "#DBEAFE",
        "header": "#1E429F",
    },
    "CATEGORIA": {
        "attrs": [
            ("PK", "id_categoria",          "Identificador único"),
            ("FK", "id_usuario",            "Usuário proprietário (opcional)"),
            ("",   "nome",                  "Nome da categoria"),
            ("",   "icone",                 "Ícone representativo"),
            ("",   "cor",                   "Cor em hexadecimal"),
            ("",   "eh_padrao",             "Indica se é categoria padrão"),
            ("",   "data_criacao",          "Data de criação"),
        ],
        "color": "#D1FAE5",
        "header": "#065F46",
    },
    "TRANSACAO": {
        "attrs": [
            ("PK", "id_transacao",          "Identificador único"),
            ("FK", "id_usuario",            "Usuário que registrou"),
            ("FK", "id_categoria",          "Categoria da transação"),
            ("",   "tipo",                  "Receita ou Despesa"),
            ("",   "valor",                 "Valor monetário"),
            ("",   "descricao",             "Descrição da transação"),
            ("",   "origem",                "Origem/fonte (receita)"),
            ("",   "data_transacao",        "Data da transação"),
            ("",   "conta",                 "Conta bancária associada"),
            ("",   "forma_pagamento",       "Forma de pagamento"),
            ("",   "recorrente",            "Se é transação recorrente"),
            ("",   "frequencia_recorrencia","Frequência (mensal, semanal...)"),
            ("",   "notas",                 "Observações adicionais"),
            ("",   "data_criacao",          "Data de registro no sistema"),
        ],
        "color": "#FEF3C7",
        "header": "#92400E",
    },
}

RELATIONSHIPS = [
    # (entity_a, entity_b, label, card_a, card_b)
    ("USUARIO",    "CATEGORIA",  "cria",      "1", "0..N"),
    ("USUARIO",    "TRANSACAO",  "registra",  "1", "1..N"),
    ("CATEGORIA",  "TRANSACAO",  "classifica","1", "0..N"),
]

# ─────────────────────────────────────────────
# Dados do Modelo Físico
# ─────────────────────────────────────────────

TABLES = {
    "usuarios": {
        "cols": [
            ("PK", "id",           "SERIAL",        "NOT NULL, PRIMARY KEY"),
            ("",   "nome",         "VARCHAR(100)",   "NOT NULL"),
            ("",   "email",        "VARCHAR(150)",   "NOT NULL, UNIQUE"),
            ("",   "senha_hash",   "VARCHAR(255)",   "NOT NULL"),
            ("",   "data_cadastro","TIMESTAMP",      "NOT NULL DEFAULT NOW()"),
        ],
        "color": "#DBEAFE",
        "header": "#1E429F",
    },
    "categorias": {
        "cols": [
            ("PK", "id",           "SERIAL",        "NOT NULL, PRIMARY KEY"),
            ("FK", "id_usuario",   "INTEGER",       "REFERENCES usuarios(id) ON DELETE CASCADE"),
            ("",   "nome",         "VARCHAR(100)",  "NOT NULL"),
            ("",   "icone",        "VARCHAR(50)",   "NOT NULL"),
            ("",   "cor",          "CHAR(7)",       "NOT NULL"),
            ("",   "eh_padrao",    "BOOLEAN",       "NOT NULL DEFAULT FALSE"),
            ("",   "data_criacao", "TIMESTAMP",     "NOT NULL DEFAULT NOW()"),
        ],
        "color": "#D1FAE5",
        "header": "#065F46",
    },
    "transacoes": {
        "cols": [
            ("PK", "id",                    "SERIAL",        "NOT NULL, PRIMARY KEY"),
            ("FK", "id_usuario",            "INTEGER",       "NOT NULL, REFERENCES usuarios(id)"),
            ("FK", "id_categoria",          "INTEGER",       "REFERENCES categorias(id) ON DELETE SET NULL"),
            ("",   "tipo",                  "VARCHAR(10)",   "NOT NULL, CHECK IN ('receita','despesa')"),
            ("",   "valor",                 "NUMERIC(12,2)", "NOT NULL, CHECK > 0"),
            ("",   "descricao",             "VARCHAR(255)",  "NOT NULL"),
            ("",   "origem",                "VARCHAR(100)",  "NULL"),
            ("",   "data_transacao",        "DATE",          "NOT NULL"),
            ("",   "conta",                 "VARCHAR(100)",  "NULL"),
            ("",   "forma_pagamento",       "VARCHAR(50)",   "NULL"),
            ("",   "recorrente",            "BOOLEAN",       "NOT NULL DEFAULT FALSE"),
            ("",   "frequencia_recorrencia","VARCHAR(20)",   "NULL"),
            ("",   "notas",                 "TEXT",          "NULL"),
            ("",   "data_criacao",          "TIMESTAMP",     "NOT NULL DEFAULT NOW()"),
        ],
        "color": "#FEF3C7",
        "header": "#92400E",
    },
}

FK_LINES_PHYSICAL = [
    # (table_from, col_from, table_to, col_to)
    ("categorias",  "id_usuario",  "usuarios",   "id"),
    ("transacoes",  "id_usuario",  "usuarios",   "id"),
    ("transacoes",  "id_categoria","categorias", "id"),
]


# ═══════════════════════════════════════════════════════════════
#  HELPER: desenha caixa de entidade com atributos (modelo lógico)
# ═══════════════════════════════════════════════════════════════

def draw_entity(ax, x, y, w, h_row, name, attrs, color, header_color):
    """
    Desenha uma caixa de entidade com cabeçalho e lista de atributos.
    Retorna os centros de cada linha para conexões.
    """
    n = len(attrs)
    total_h = h_row * (n + 1)   # +1 para o cabeçalho

    # Sombra
    shadow = FancyBboxPatch((x + 0.04, y - total_h - 0.04), w, total_h,
                             boxstyle="round,pad=0.03", linewidth=0,
                             facecolor="#CBD5E1", zorder=1)
    ax.add_patch(shadow)

    # Cabeçalho
    header_rect = FancyBboxPatch((x, y - h_row), w, h_row,
                                  boxstyle="round,pad=0.0",
                                  linewidth=1.5, edgecolor=header_color,
                                  facecolor=header_color, zorder=2)
    ax.add_patch(header_rect)
    ax.text(x + w / 2, y - h_row / 2, name,
            ha='center', va='center', fontsize=9, fontweight='bold',
            color='white', zorder=3)

    # Corpo
    body_rect = FancyBboxPatch((x, y - total_h), w, total_h - h_row,
                                boxstyle="round,pad=0.0",
                                linewidth=1.5, edgecolor=header_color,
                                facecolor=color, zorder=2)
    ax.add_patch(body_rect)

    row_centers = {}
    for i, (tag, attr_name, desc) in enumerate(attrs):
        row_y = y - h_row * (i + 1.5)

        # Linha separadora
        if i > 0:
            ax.plot([x, x + w], [y - h_row * (i + 1), y - h_row * (i + 1)],
                    color=header_color, lw=0.4, alpha=0.4, zorder=3)

        # Badge PK/FK
        if tag in ("PK", "FK"):
            badge_color = "#F59E0B" if tag == "PK" else "#10B981"
            badge = FancyBboxPatch((x + 0.06, row_y - 0.09), 0.28, 0.18,
                                   boxstyle="round,pad=0.02",
                                   linewidth=0, facecolor=badge_color, zorder=4)
            ax.add_patch(badge)
            ax.text(x + 0.20, row_y, tag,
                    ha='center', va='center', fontsize=5.5, fontweight='bold',
                    color='white', zorder=5)
            attr_x = x + 0.42
        else:
            attr_x = x + 0.14

        ax.text(attr_x, row_y, attr_name,
                ha='left', va='center', fontsize=7.2, color=C_TEXT_DARK, zorder=4)

        row_centers[attr_name] = (x + w / 2, row_y)

    # Retorna centro do cabeçalho e dicionário de linhas
    return (x + w / 2, y - h_row / 2), row_centers, total_h


def draw_relationship_diamond(ax, cx, cy, w, h, label):
    """Desenha um losango de relacionamento."""
    dx, dy = w / 2, h / 2
    diamond = plt.Polygon(
        [(cx, cy + dy), (cx + dx, cy), (cx, cy - dy), (cx - dx, cy)],
        closed=True, facecolor=C_REL, edgecolor="#9CA3AF", linewidth=1.2, zorder=3)
    ax.add_patch(diamond)
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=6.5, fontweight='bold', color=C_TEXT_MID, zorder=4)


def draw_arrow_with_card(ax, x1, y1, x2, y2, card1, card2):
    """Linha de relacionamento com cardinalidades nas pontas."""
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-", color=C_LINE, lw=1.5),
                zorder=2)
    # Cardinalidades
    offset = 0.18
    mx = (x1 * 0.2 + x2 * 0.8)
    my = (y1 * 0.2 + y2 * 0.8)
    ax.text(x1 + (x2 - x1) * 0.08, y1 + (y2 - y1) * 0.08,
            card1, fontsize=7, color=C_PRIMARY, fontweight='bold', ha='center', va='center', zorder=5)
    ax.text(x1 + (x2 - x1) * 0.92, y1 + (y2 - y1) * 0.92,
            card2, fontsize=7, color=C_PRIMARY, fontweight='bold', ha='center', va='center', zorder=5)


# ═══════════════════════════════════════════════════════════════
#  DIAGRAMA 1 – MODELO LÓGICO
# ═══════════════════════════════════════════════════════════════

def build_logical_diagram():
    # Figura mais alta para acomodar TRANSACAO (14 atributos) sem sobrepor a legenda
    fig, ax = plt.subplots(figsize=(16, 18))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 18)
    ax.axis('off')
    fig.patch.set_facecolor('#F8FAFC')

    # Título
    ax.text(8, 17.4, "DIAGRAMA DO MODELO LÓGICO",
            ha='center', va='center', fontsize=15, fontweight='bold',
            color=C_HEADER,
            bbox=dict(boxstyle="round,pad=0.4", facecolor=C_ACCENT,
                      edgecolor=C_BORDER, linewidth=2))
    ax.text(8, 16.85, "Sistema Fintech – Controle Financeiro Pessoal",
            ha='center', va='center', fontsize=9, color=C_TEXT_LIGHT)

    h_row = 0.40
    ent_w = 3.8

    # ── USUARIO (esquerda) ──────────────────────────────────
    usr_attrs = ENTITIES["USUARIO"]["attrs"]
    usr_x, usr_y = 0.4, 15.8
    draw_entity(ax, usr_x, usr_y, ent_w, h_row,
                "USUARIO", usr_attrs,
                ENTITIES["USUARIO"]["color"],
                ENTITIES["USUARIO"]["header"])
    usr_cx = usr_x + ent_w / 2
    usr_total_h = h_row * (len(usr_attrs) + 1)   # 2.4
    usr_bottom  = usr_y - usr_total_h             # 13.4
    usr_mid_y   = usr_y - usr_total_h / 2         # 14.6

    # ── CATEGORIA (direita) ─────────────────────────────────
    cat_attrs = ENTITIES["CATEGORIA"]["attrs"]
    cat_x, cat_y = 11.8, 15.8
    draw_entity(ax, cat_x, cat_y, ent_w, h_row,
                "CATEGORIA", cat_attrs,
                ENTITIES["CATEGORIA"]["color"],
                ENTITIES["CATEGORIA"]["header"])
    cat_cx = cat_x + ent_w / 2
    cat_total_h = h_row * (len(cat_attrs) + 1)   # 3.2
    cat_bottom  = cat_y - cat_total_h             # 12.6
    cat_mid_y   = cat_y - cat_total_h / 2         # 14.2

    # ── TRANSACAO (centro-baixo) ────────────────────────────
    # Posicionada com bottom em ~3.8 para deixar espaço à legenda
    tra_attrs  = ENTITIES["TRANSACAO"]["attrs"]
    tra_total_h = h_row * (len(tra_attrs) + 1)    # 6.0
    tra_y = 3.8 + tra_total_h                      # 9.8  → bottom em 3.8
    tra_x = 6.1
    draw_entity(ax, tra_x, tra_y, ent_w, h_row,
                "TRANSACAO", tra_attrs,
                ENTITIES["TRANSACAO"]["color"],
                ENTITIES["TRANSACAO"]["header"])
    tra_cx     = tra_x + ent_w / 2
    tra_bottom = tra_y - tra_total_h               # 3.8
    tra_mid_y  = tra_y - tra_total_h / 2           # 6.8

    # ── Losangos de relacionamento ──────────────────────────
    # 1) USUARIO --[cria]--> CATEGORIA  (horizontal na altura média de CATEGORIA)
    rel1_cx = 8.0
    rel1_cy = cat_mid_y                            # 14.2
    draw_relationship_diamond(ax, rel1_cx, rel1_cy, 1.4, 0.48, "cria")
    # linhas e cardinalidades
    draw_arrow_with_card(ax, usr_x + ent_w, rel1_cy, rel1_cx - 0.70, rel1_cy, "1", "0..N")
    ax.annotate("", xy=(cat_x, rel1_cy), xytext=(rel1_cx + 0.70, rel1_cy),
                arrowprops=dict(arrowstyle="-", color=C_LINE, lw=1.5), zorder=2)

    # 2) USUARIO --[registra]--> TRANSACAO  (desce pela esquerda)
    rel2_cx = usr_cx                               # 2.3
    rel2_cy = (usr_bottom + tra_y) / 2            # (13.4 + 9.8)/2 = 11.6
    draw_relationship_diamond(ax, rel2_cx, rel2_cy, 1.4, 0.48, "registra")
    ax.plot([usr_cx, rel2_cx], [usr_bottom, rel2_cy + 0.24],
            color=C_LINE, lw=1.5, zorder=2)
    ax.plot([rel2_cx, tra_cx], [rel2_cy - 0.24, tra_y],
            color=C_LINE, lw=1.5, zorder=2)
    ax.text(usr_cx - 0.28, usr_bottom + 0.22, "1",
            fontsize=7, color=C_PRIMARY, fontweight='bold', ha='center', zorder=5)
    ax.text(tra_cx - 0.36, tra_y + 0.22, "1..N",
            fontsize=7, color=C_PRIMARY, fontweight='bold', ha='center', zorder=5)

    # 3) CATEGORIA --[classifica]--> TRANSACAO  (desce pela direita)
    rel3_cx = cat_cx                               # 13.7
    rel3_cy = (cat_bottom + tra_y) / 2            # (12.6 + 9.8)/2 = 11.2
    draw_relationship_diamond(ax, rel3_cx, rel3_cy, 1.6, 0.48, "classifica")
    ax.plot([cat_cx, rel3_cx], [cat_bottom, rel3_cy + 0.24],
            color=C_LINE, lw=1.5, zorder=2)
    ax.plot([rel3_cx, tra_cx + ent_w], [rel3_cy - 0.24, tra_y - h_row / 2],
            color=C_LINE, lw=1.5, zorder=2)
    ax.text(cat_cx + 0.28, cat_bottom + 0.22, "1",
            fontsize=7, color=C_PRIMARY, fontweight='bold', ha='center', zorder=5)
    ax.text(tra_cx + ent_w + 0.30, tra_y - h_row / 2 + 0.18, "0..N",
            fontsize=7, color=C_PRIMARY, fontweight='bold', ha='center', zorder=5)

    # ── Legenda (abaixo de TRANSACAO, sem sobreposição) ────
    legend_x, legend_y = 0.3, 2.9
    ax.text(legend_x, legend_y + 0.42, "LEGENDA", fontsize=8, fontweight='bold', color=C_HEADER)

    items = [
        (C_HEADER,   "Entidade"),
        ("#F59E0B",  "Chave Primária (PK)"),
        ("#10B981",  "Chave Estrangeira (FK)"),
        (C_REL,      "Relacionamento"),
    ]
    for idx, (col, lbl) in enumerate(items):
        bx = legend_x + idx * 3.5
        rect = FancyBboxPatch((bx, legend_y - 0.02), 0.32, 0.28,
                               boxstyle="round,pad=0.03",
                               linewidth=1, edgecolor="#6B7280",
                               facecolor=col, zorder=3)
        ax.add_patch(rect)
        ax.text(bx + 0.44, legend_y + 0.12, lbl, fontsize=7.5, va='center', color=C_TEXT_MID)

    ax.plot([0.3, 15.7], [2.5, 2.5], color="#CBD5E1", lw=1.0)
    ax.text(0.3, 2.1, "Cardinalidades:  1 = exatamente um   |   0..N = zero ou muitos   |   1..N = um ou muitos",
            fontsize=7.5, color=C_TEXT_LIGHT)
    ax.text(0.3, 1.7, "O modelo reflete o sistema Fintech conforme User Stories US01–US05 e casos de uso documentados.",
            fontsize=7.5, color=C_TEXT_LIGHT)

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=180, bbox_inches='tight',
                facecolor=fig.get_facecolor())
    buf.seek(0)
    plt.close(fig)
    return buf


# ═══════════════════════════════════════════════════════════════
#  HELPER: desenha tabela do modelo físico
# ═══════════════════════════════════════════════════════════════

def draw_table(ax, x, y, w, h_row, name, cols, color, header_color):
    n = len(cols)
    total_h = h_row * (n + 1)

    # Sombra
    shadow = FancyBboxPatch((x + 0.04, y - total_h - 0.04), w, total_h,
                             boxstyle="round,pad=0.0", linewidth=0,
                             facecolor="#CBD5E1", zorder=1)
    ax.add_patch(shadow)

    # Cabeçalho
    hdr = FancyBboxPatch((x, y - h_row), w, h_row,
                          boxstyle="round,pad=0.0",
                          linewidth=1.5, edgecolor=header_color,
                          facecolor=header_color, zorder=2)
    ax.add_patch(hdr)
    ax.text(x + w / 2, y - h_row / 2, name,
            ha='center', va='center', fontsize=9, fontweight='bold',
            color='white', zorder=3)

    # Sub-cabeçalho das colunas
    sub_y = y - h_row
    sub_h = h_row * 0.6
    sub = FancyBboxPatch((x, sub_y - sub_h), w, sub_h,
                          boxstyle="round,pad=0.0",
                          linewidth=0, facecolor="#E5E7EB", zorder=2)
    ax.add_patch(sub)
    cols_x = [x + 0.05, x + 1.05, x + 2.25]
    cols_w = [0.95, 1.15, w - 2.30]
    sub_labels = ["Coluna", "Tipo", "Restrições"]
    for cx, lbl in zip(cols_x, sub_labels):
        ax.text(cx, sub_y - sub_h / 2, lbl,
                ha='left', va='center', fontsize=6.5,
                fontweight='bold', color="#374151", zorder=3)

    # Corpo
    body = FancyBboxPatch((x, y - total_h - sub_h + h_row), w,
                           total_h - h_row - sub_h + h_row,
                           boxstyle="round,pad=0.0",
                           linewidth=1.5, edgecolor=header_color,
                           facecolor=color, zorder=2)
    ax.add_patch(body)

    row_mid_ys = {}
    for i, (tag, col_name, col_type, constraints) in enumerate(cols):
        row_top = sub_y - sub_h - h_row * i
        row_cy = row_top - h_row / 2

        # Linha separadora
        if i > 0:
            ax.plot([x, x + w], [row_top, row_top],
                    color=header_color, lw=0.35, alpha=0.35, zorder=3)

        # Fundo alternado leve
        if i % 2 == 0:
            alt = FancyBboxPatch((x + 0.01, row_top - h_row + 0.01),
                                  w - 0.02, h_row - 0.02,
                                  boxstyle="round,pad=0.0",
                                  linewidth=0, facecolor="#F9FAFB", alpha=0.7, zorder=2)
            ax.add_patch(alt)

        # Badge PK/FK
        if tag in ("PK", "FK"):
            badge_col = "#F59E0B" if tag == "PK" else "#10B981"
            badge = FancyBboxPatch((x + 0.06, row_cy - 0.085), 0.26, 0.17,
                                   boxstyle="round,pad=0.02",
                                   linewidth=0, facecolor=badge_col, zorder=4)
            ax.add_patch(badge)
            ax.text(x + 0.19, row_cy, tag,
                    ha='center', va='center', fontsize=5.0,
                    fontweight='bold', color='white', zorder=5)
            name_x = x + 0.40
        else:
            name_x = x + 0.10

        ax.text(name_x, row_cy, col_name,
                ha='left', va='center', fontsize=6.8, color=C_TEXT_DARK, zorder=4)
        ax.text(x + 1.08, row_cy, col_type,
                ha='left', va='center', fontsize=6.5,
                color="#1D4ED8", fontfamily='monospace', zorder=4)
        ax.text(x + 2.30, row_cy, constraints,
                ha='left', va='center', fontsize=5.8, color=C_TEXT_MID, zorder=4)

        row_mid_ys[col_name] = row_cy

    return row_mid_ys, sub_h, total_h


# ═══════════════════════════════════════════════════════════════
#  DIAGRAMA 2 – MODELO FÍSICO
# ═══════════════════════════════════════════════════════════════

def build_physical_diagram():
    fig, ax = plt.subplots(figsize=(20, 14))
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 14)
    ax.axis('off')
    fig.patch.set_facecolor('#F8FAFC')

    # Título
    ax.text(10, 13.5, "DIAGRAMA DO MODELO FÍSICO",
            ha='center', va='center', fontsize=15, fontweight='bold',
            color=C_HEADER,
            bbox=dict(boxstyle="round,pad=0.4", facecolor=C_ACCENT,
                      edgecolor=C_BORDER, linewidth=2))
    ax.text(10, 13.0, "Sistema Fintech – Controle Financeiro Pessoal  |  SGBD: PostgreSQL",
            ha='center', va='center', fontsize=9, color=C_TEXT_LIGHT)

    h_row = 0.38
    tbl_w = 6.2

    # ── usuarios (esquerda) ──────────────────────────────
    usr_data = TABLES["usuarios"]
    usr_x, usr_y = 0.4, 12.4
    usr_rows, usr_sub_h, usr_total_h = draw_table(
        ax, usr_x, usr_y, tbl_w, h_row, "usuarios",
        usr_data["cols"], usr_data["color"], usr_data["header"])
    usr_right_x = usr_x + tbl_w
    usr_header_cy = usr_y - h_row / 2

    # ── categorias (direita) ─────────────────────────────
    cat_data = TABLES["categorias"]
    cat_x, cat_y = 13.4, 12.4
    cat_rows, cat_sub_h, cat_total_h = draw_table(
        ax, cat_x, cat_y, tbl_w, h_row, "categorias",
        cat_data["cols"], cat_data["color"], cat_data["header"])
    cat_header_cy = cat_y - h_row / 2

    # ── transacoes (centro-baixo) ────────────────────────
    tra_data = TABLES["transacoes"]
    tra_x, tra_y = 6.9, 7.8
    tra_rows, tra_sub_h, tra_total_h = draw_table(
        ax, tra_x, tra_y, tbl_w, h_row, "transacoes",
        tra_data["cols"], tra_data["color"], tra_data["header"])
    tra_header_cy = tra_y - h_row / 2

    # ── FK: categorias.id_usuario → usuarios.id ─────────
    # Ponto de saída: lado esquerdo da coluna id_usuario em categorias
    cat_fk_usr_y = cat_rows.get("id_usuario", cat_header_cy)
    usr_pk_y     = usr_rows.get("id", usr_header_cy)
    # Linha de FK com cor específica
    ax.annotate("",
                xy=(usr_right_x, usr_pk_y),
                xytext=(cat_x, cat_fk_usr_y),
                arrowprops=dict(
                    arrowstyle="<-",
                    color="#10B981",
                    lw=1.8,
                    connectionstyle="arc3,rad=0.0"))
    mid_x = (usr_right_x + cat_x) / 2
    mid_y = (usr_pk_y + cat_fk_usr_y) / 2
    ax.text(mid_x, mid_y + 0.18, "FK", fontsize=6.5,
            ha='center', color="#10B981", fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.15", facecolor="white",
                      edgecolor="#10B981", lw=0.8))

    # ── FK: transacoes.id_usuario → usuarios.id ─────────
    tra_fk_usr_y  = tra_rows.get("id_usuario", tra_header_cy)
    ax.annotate("",
                xy=(usr_x + tbl_w * 0.35, usr_y - usr_total_h - usr_sub_h + h_row),
                xytext=(tra_x, tra_fk_usr_y),
                arrowprops=dict(
                    arrowstyle="<-",
                    color="#10B981",
                    lw=1.8,
                    connectionstyle="arc3,rad=-0.25"))
    ax.text(tra_x - 0.7, tra_fk_usr_y - 0.35, "FK → usuarios",
            fontsize=6, color="#10B981", fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.15", facecolor="white",
                      edgecolor="#10B981", lw=0.8))

    # ── FK: transacoes.id_categoria → categorias.id ─────
    tra_fk_cat_y  = tra_rows.get("id_categoria", tra_header_cy)
    cat_pk_y      = cat_rows.get("id", cat_header_cy)
    ax.annotate("",
                xy=(cat_x + tbl_w * 0.35, cat_y - cat_total_h - cat_sub_h + h_row),
                xytext=(tra_x + tbl_w, tra_fk_cat_y),
                arrowprops=dict(
                    arrowstyle="<-",
                    color="#10B981",
                    lw=1.8,
                    connectionstyle="arc3,rad=0.25"))
    ax.text(tra_x + tbl_w + 0.1, tra_fk_cat_y - 0.35, "FK → categorias",
            fontsize=6, color="#10B981", fontweight='bold',
            bbox=dict(boxstyle="round,pad=0.15", facecolor="white",
                      edgecolor="#10B981", lw=0.8))

    # ── Legenda ────────────────────────────────────────────
    leg_y = 1.5
    ax.text(0.4, leg_y + 0.4, "LEGENDA", fontsize=8, fontweight='bold', color=C_HEADER)
    items = [
        ("#F59E0B", "PK – Chave Primária"),
        ("#10B981", "FK – Chave Estrangeira"),
        ("#1D4ED8", "Tipo de Dado (PostgreSQL)"),
    ]
    for idx, (col, lbl) in enumerate(items):
        bx = 0.4 + idx * 5.2
        rect = FancyBboxPatch((bx, leg_y - 0.02), 0.30, 0.26,
                               boxstyle="round,pad=0.03",
                               linewidth=1, edgecolor="#6B7280",
                               facecolor=col, zorder=3)
        ax.add_patch(rect)
        ax.text(bx + 0.42, leg_y + 0.11, lbl, fontsize=7.5,
                va='center', color=C_TEXT_MID)

    ax.plot([0.4, 19.6], [1.0, 1.0], color="#CBD5E1", lw=0.8)
    ax.text(0.4, 0.68,
            "Relacionamentos:  usuarios.id ←(1:N)→ transacoes.id_usuario   |   "
            "usuarios.id ←(1:N)→ categorias.id_usuario   |   "
            "categorias.id ←(1:N)→ transacoes.id_categoria",
            fontsize=7, color=C_TEXT_LIGHT)
    ax.text(0.4, 0.32,
            "ON DELETE CASCADE em FK de usuário  |  ON DELETE SET NULL em FK de categoria nas transações  |  "
            "NUMERIC(12,2) para valores monetários",
            fontsize=7, color=C_TEXT_LIGHT)

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=180, bbox_inches='tight',
                facecolor=fig.get_facecolor())
    buf.seek(0)
    plt.close(fig)
    return buf


# ═══════════════════════════════════════════════════════════════
#  MONTAGEM DO PDF FINAL
# ═══════════════════════════════════════════════════════════════

def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=18,
        textColor=colors.HexColor("#1E429F"),
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=10,
        alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor("#1E429F"),
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold',
        borderPad=(0, 0, 4, 0),
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor("#374151"),
        spaceAfter=4,
        leading=14,
    )

    story = []

    # ── Cabeçalho ────────────────────────────────────────────
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("MODELAGEM DE DADOS – FINTECH", title_style))
    story.append(Paragraph("Sistema de Controle Financeiro Pessoal", subtitle_style))
    story.append(Spacer(1, 0.4 * cm))

    # ── Seção 1 – Modelo Lógico ───────────────────────────────
    story.append(Paragraph("1. DIAGRAMA DO MODELO LÓGICO", section_style))
    story.append(Paragraph(
        "O modelo lógico representa as <b>entidades</b>, seus <b>atributos</b> e os "
        "<b>relacionamentos</b> do sistema, de forma independente do SGBD. "
        "As entidades foram derivadas dos requisitos funcionais (User Stories US01–US05) "
        "e dos casos de uso documentados nas fases anteriores do projeto.",
        body_style))

    # Diagrama lógico (proporção 16x18)
    logical_buf = build_logical_diagram()
    logical_img = Image(logical_buf)
    logical_img.drawWidth  = 17 * cm
    logical_img.drawHeight = 17 * cm * (18 / 16)
    story.append(logical_img)
    story.append(Spacer(1, 0.4 * cm))

    # Tabela de entidades / relacionamentos
    # Usa Paragraph em cada célula para garantir quebra de linha automática
    story.append(Paragraph("Entidades e Relacionamentos:", body_style))

    cell_hdr = ParagraphStyle('CellHdr', parent=styles['Normal'],
                               fontSize=8, fontName='Helvetica-Bold',
                               textColor=colors.white, leading=11)
    cell_body = ParagraphStyle('CellBody', parent=styles['Normal'],
                                fontSize=8, fontName='Helvetica', leading=11,
                                textColor=colors.HexColor("#111827"))
    cell_rel = ParagraphStyle('CellRel', parent=styles['Normal'],
                               fontSize=8, fontName='Helvetica', leading=11,
                               textColor=colors.HexColor("#1D4ED8"))

    ent_data = [
        [Paragraph("Entidade", cell_hdr),
         Paragraph("Descrição", cell_hdr),
         Paragraph("Relacionamentos", cell_hdr)],
        [Paragraph("USUARIO", cell_body),
         Paragraph("Pessoa física que usa o sistema para gerenciar suas finanças pessoais.", cell_body),
         Paragraph("1 usuário → N transações<br/>1 usuário → N categorias personalizadas", cell_rel)],
        [Paragraph("CATEGORIA", cell_body),
         Paragraph("Agrupamento temático das transações (ex: Alimentação, Lazer).", cell_body),
         Paragraph("1 categoria → N transações<br/>Pode ser padrão do sistema ou criada pelo usuário", cell_rel)],
        [Paragraph("TRANSACAO", cell_body),
         Paragraph("Registro financeiro de receita ou despesa realizado pelo usuário.", cell_body),
         Paragraph("N transações → 1 categoria<br/>N transações → 1 usuário", cell_rel)],
    ]
    ent_table = Table(ent_data, colWidths=[3.0 * cm, 7.5 * cm, 6.0 * cm])
    ent_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0), colors.HexColor("#1E429F")),
        ('BACKGROUND',    (0, 1), (-1, 1), colors.HexColor("#DBEAFE")),
        ('BACKGROUND',    (0, 2), (-1, 2), colors.HexColor("#D1FAE5")),
        ('BACKGROUND',    (0, 3), (-1, 3), colors.HexColor("#FEF3C7")),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(ent_table)

    # ── Quebra de página ──────────────────────────────────────
    story.append(PageBreak())

    # ── Seção 2 – Modelo Físico ───────────────────────────────
    story.append(Paragraph("2. DIAGRAMA DO MODELO FÍSICO", section_style))
    story.append(Paragraph(
        "O modelo físico é a implementação do modelo lógico em <b>PostgreSQL</b>. "
        "Define os tipos de dados, restrições (constraints), chaves primárias (PK) e "
        "chaves estrangeiras (FK) que garantem a integridade referencial do banco.",
        body_style))

    # Diagrama físico
    physical_buf = build_physical_diagram()
    physical_img = Image(physical_buf)
    physical_img.drawWidth  = 17 * cm
    physical_img.drawHeight = 17 * cm * (14 / 20)
    story.append(physical_img)
    story.append(Spacer(1, 0.4 * cm))

    # Tabela DDL resumida — Paragraph em todas as células para quebra automática
    story.append(Paragraph("Estrutura das Tabelas (DDL Resumido):", body_style))

    ddl_hdr = ParagraphStyle('DdlHdr', parent=styles['Normal'],
                              fontSize=8, fontName='Helvetica-Bold',
                              textColor=colors.white, leading=11)
    ddl_body = ParagraphStyle('DdlBody', parent=styles['Normal'],
                               fontSize=8, fontName='Helvetica', leading=11,
                               textColor=colors.HexColor("#111827"))
    ddl_code = ParagraphStyle('DdlCode', parent=styles['Normal'],
                               fontSize=7.5, fontName='Courier', leading=11,
                               textColor=colors.HexColor("#1D4ED8"))

    ddl_data = [
        [Paragraph("Tabela",             ddl_hdr),
         Paragraph("Chave Primária",     ddl_hdr),
         Paragraph("Chaves Estrangeiras",ddl_hdr),
         Paragraph("Constraint principal",ddl_hdr)],
        [Paragraph("usuarios",  ddl_body),
         Paragraph("id SERIAL", ddl_code),
         Paragraph("—",         ddl_body),
         Paragraph("email UNIQUE", ddl_code)],
        [Paragraph("categorias", ddl_body),
         Paragraph("id SERIAL",  ddl_code),
         Paragraph("id_usuario → usuarios(id)<br/>ON DELETE CASCADE", ddl_code),
         Paragraph("nome NOT NULL", ddl_code)],
        [Paragraph("transacoes", ddl_body),
         Paragraph("id SERIAL",  ddl_code),
         Paragraph("id_usuario → usuarios(id)<br/>id_categoria → categorias(id)<br/>ON DELETE SET NULL", ddl_code),
         Paragraph("tipo CHECK IN<br/>('receita','despesa')<br/>valor NUMERIC(12,2) &gt; 0", ddl_code)],
    ]
    ddl_table = Table(ddl_data, colWidths=[2.6 * cm, 2.6 * cm, 6.4 * cm, 4.9 * cm])
    ddl_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0), colors.HexColor("#1E429F")),
        ('BACKGROUND',    (0, 1), (-1, 1), colors.HexColor("#DBEAFE")),
        ('BACKGROUND',    (0, 2), (-1, 2), colors.HexColor("#D1FAE5")),
        ('BACKGROUND',    (0, 3), (-1, 3), colors.HexColor("#FEF3C7")),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(ddl_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Considerações finais ──────────────────────────────────
    story.append(Paragraph("Considerações sobre o Modelo:", section_style))
    consideracoes = [
        ("Normalização", "O modelo está na 3ª Forma Normal (3FN): sem redundâncias, "
         "sem dependências transitivas. As categorias são separadas das transações evitando repetição de dados."),
        ("Integridade Referencial", "Chaves estrangeiras com ON DELETE CASCADE (usuário) "
         "garantem que transações e categorias orphans não existam. ON DELETE SET NULL em "
         "categoria preserva o histórico de transações mesmo após exclusão da categoria."),
        ("Extensibilidade", "A estrutura suporta expansões futuras: tabelas de metas "
         "(meta_financeira), dívidas (divida) e investimentos (investimento) podem ser "
         "adicionadas referenciando id_usuario sem alterar o núcleo existente."),
        ("Alinhamento com o código", "O modelo reflete diretamente o schema implementado "
         "com Drizzle ORM (categoriesTable, transactionsTable) acrescido de USUARIO para "
         "suportar autenticação — pré-condição exigida nos casos de uso documentados."),
    ]
    for titulo, texto in consideracoes:
        story.append(Paragraph(f"<b>{titulo}:</b> {texto}", body_style))

    doc.build(story)
    print(f"PDF gerado: {output_path}")


if __name__ == "__main__":
    out = "/home/user/financeapp/modelos_logico_fisico.pdf"
    build_pdf(out)
