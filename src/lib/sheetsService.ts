import { RSVPData } from '../types';

export const SHEET_COLUMNS = [
  'Data/Hora do Envio',
  'Nome Completo',
  'Status de Presença',
  'Total Adultos',
  'Total Crianças',
  'Nomes dos Acompanhantes',
  'WhatsApp / Telefone',
  'Restrições / Observações',
  'Mensagem para o Casal',
];

/**
 * Creates a formatted Google Sheet specifically for wedding RSVPs
 */
export async function createRSVPSheet(
  accessToken: string,
  title: string = 'RSVP - Casamento Johnatan & Regiane 2026'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Confirmações de Presença',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: SHEET_COLUMNS.map((col) => ({
                    userEnteredValue: { stringValue: col },
                    userEnteredFormat: {
                      textFormat: { bold: true, foregroundColor: { red: 0.15, green: 0.35, blue: 0.3 } },
                      backgroundColor: { red: 0.88, green: 0.95, blue: 0.92 }, // Soft pastel seafoam
                      horizontalAlignment: 'CENTER',
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao criar planilha: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Appends a single RSVP entry into the Google Sheet
 */
export async function appendRSVPToSheet(
  accessToken: string,
  spreadsheetId: string,
  rsvp: RSVPData
): Promise<boolean> {
  const statusLabel = rsvp.attending === 'yes' ? 'Sim, confirmado! 🎉' : 'Não poderá comparecer 💔';
  const rowValues = [
    new Date(rsvp.submittedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    rsvp.fullName,
    statusLabel,
    rsvp.adultsCount,
    rsvp.childrenCount,
    rsvp.companionNames || '-',
    rsvp.phone,
    rsvp.dietaryRestrictions || '-',
    rsvp.message || '-',
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro ao enviar linha para a planilha: ${err}`);
  }

  return true;
}

/**
 * Appends multiple RSVPs in batch
 */
export async function batchAppendRSVPs(
  accessToken: string,
  spreadsheetId: string,
  rsvps: RSVPData[]
): Promise<number> {
  if (!rsvps.length) return 0;

  const rows = rsvps.map((rsvp) => [
    new Date(rsvp.submittedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    rsvp.fullName,
    rsvp.attending === 'yes' ? 'Sim, confirmado! 🎉' : 'Não poderá comparecer 💔',
    rsvp.adultsCount,
    rsvp.childrenCount,
    rsvp.companionNames || '-',
    rsvp.phone,
    rsvp.dietaryRestrictions || '-',
    rsvp.message || '-',
  ]);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro na sincronização em lote: ${err}`);
  }

  return rows.length;
}

/**
 * Verifies if a spreadsheet exists and is accessible
 */
export async function verifySheetAccess(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetNames: string[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Não foi possível acessar a planilha informada. Verifique o ID e suas permissões.');
  }

  const data = await response.json();
  return {
    title: data.properties?.title || 'Planilha Google',
    sheetNames: (data.sheets || []).map((s: any) => s.properties?.title),
  };
}
