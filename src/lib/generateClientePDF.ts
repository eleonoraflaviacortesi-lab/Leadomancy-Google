import { Cliente } from "@/src/types";
import { ClienteActivity } from "@/src/hooks/useClienteActivities";
import { PropertyMatch } from "@/src/hooks/usePropertyMatches";
import { formatCurrency } from "@/src/lib/utils";

export function generateClientePDF(
  cliente: Cliente,
  activities: ClienteActivity[],
  matches: PropertyMatch[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Per favore, consenti i popup per scaricare il PDF.');
    return;
  }

  const lastActivities = activities.slice(0, 10);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ALTAIR - ${cliente.nome} ${cliente.cognome}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Outfit', sans-serif;
          color: #1a1a1a;
          line-height: 1.5;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: -1px;
        }
        .header-meta {
          text-align: right;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #666;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .info-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: #999;
          display: block;
        }
        .info-value {
          font-size: 14px;
          font-weight: 500;
        }
        .budget {
          font-size: 24px;
          font-weight: 700;
          color: #000;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          background: #f0f0f0;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          margin-right: 5px;
          margin-bottom: 5px;
        }
        .note-box {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          font-size: 13px;
          white-space: pre-wrap;
        }
        .activity-item {
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .activity-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .activity-title {
          font-size: 13px;
          font-weight: 600;
        }
        .activity-date {
          font-size: 11px;
          color: #999;
        }
        .activity-desc {
          font-size: 12px;
          color: #666;
        }
        .match-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #fff;
          border: 1px solid #eee;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .match-info h4 {
          margin: 0;
          font-size: 14px;
        }
        .match-score {
          font-weight: 700;
          color: #4f46e5;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${cliente.nome} ${cliente.cognome}</h1>
          <div style="font-size: 14px; color: #666; margin-top: 5px;">
            ${cliente.paese} &bull; ${cliente.lingua}
          </div>
        </div>
        <div class="header-meta">
          ALTAIR CRM<br>
          Ciclo generato il ${new Date().toLocaleDateString('it-IT')}
        </div>
      </div>

      <div class="grid">
        <div class="section">
          <div class="section-title">Contatti</div>
          <div class="info-item">
            <span class="info-label">Telefono</span>
            <span class="info-value">${cliente.telefono || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">${cliente.email || '-'}</span>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Budget</div>
          <div class="info-item">
            <span class="info-label">Budget Massimo</span>
            <span class="budget">${cliente.budget_max ? formatCurrency(cliente.budget_max) : '-'}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Ricerca</div>
        <div class="grid">
          <div class="info-item">
            <span class="info-label">Regioni</span>
            <div>${cliente.regioni?.map(r => `<span class="badge">${r}</span>`).join('') || '-'}</div>
          </div>
          <div class="info-item">
            <span class="info-label">Tipologia</span>
            <div>${cliente.tipologia?.map(t => `<span class="badge">${t}</span>`).join('') || '-'}</div>
          </div>
          <div class="info-item">
            <span class="info-label">Stile</span>
            <span class="info-value">${cliente.stile || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Dimensioni</span>
            <span class="info-value">${cliente.dimensione_min} - ${cliente.dimensione_max} mq</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Note e Descrizione</div>
        <div class="note-box">
          <strong>Descrizione:</strong><br>
          ${cliente.descrizione || 'Nessuna descrizione.'}
          <br><br>
          <strong>Note Extra:</strong><br>
          ${cliente.note_extra || 'Nessuna nota extra.'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Ultime Attività</div>
        ${lastActivities.length > 0 ? lastActivities.map(a => `
          <div class="activity-item">
            <div class="activity-header">
              <span class="activity-title">${a.title}</span>
              <span class="activity-date">${new Date(a.created_at).toLocaleDateString('it-IT')}</span>
            </div>
            ${a.description ? `<div class="activity-desc">${a.description}</div>` : ''}
          </div>
        `).join('') : '<div class="activity-desc">Nessuna attività registrata.</div>'}
      </div>

      <div class="section">
        <div class="section-title">Proprietà Abbinate</div>
        ${matches.length > 0 ? matches.map(m => `
          <div class="match-item">
            <div class="match-info">
              <h4>${m.titolo}</h4>
              <div style="font-size: 11px; color: #999;">${m.url || ''}</div>
              ${m.notes ? `<div style="font-size: 12px; margin-top: 5px;">${m.notes}</div>` : ''}
            </div>
            <div class="match-score">${m.compatibilita || 0}/10</div>
          </div>
        `).join('') : '<div class="activity-desc">Nessuna proprietà abbinata.</div>'}
      </div>

      <script>
        window.onload = () => {
          window.print();
          // window.close(); // Optional: close after printing
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
