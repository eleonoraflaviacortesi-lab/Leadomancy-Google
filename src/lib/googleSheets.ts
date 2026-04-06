/**
 * ALTAIR Google Sheets Data Layer
 * Handles all CRUD operations using the Google Sheets API.
 */

export const SHEETS = {
  clienti: 'clienti',
  notizie: 'notizie',
  appointments: 'appointments',
  users: 'users',
  daily_reports: 'daily_reports',
  chat_messages: 'chat_messages',
  meetings: 'meetings',
  operations: 'operations',
  sede_targets: 'sede_targets',
} as const;

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;

/**
 * In-memory cache for sheet headers to minimize API calls.
 */
const headerCache = new Map<string, string[]>();

/**
 * Ensures the Google Sheets API is loaded before proceeding.
 */
async function ensureSheetsApi(): Promise<void> {
  const g = (window as any).gapi;
  
  if (g?.client?.sheets) return;
  
  console.log("[GoogleSheets] Sheets API not ready, checking gapi...");
  
  if (!g) {
    console.warn("[GoogleSheets] gapi not found on window, waiting...");
  } else if (g.client) {
    if (!g.client.sheets) {
      console.log("[GoogleSheets] gapi.client found but sheets missing, attempting manual load...");
      try {
        const loadApi = (name: string, version: string) => {
          return new Promise((resolve) => {
            g.client.load(name, version, () => resolve(true));
          });
        };
        
        // Try discovery URL first
        try {
          await new Promise((resolve) => {
            g.client.load('https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest', () => resolve(true));
          });
        } catch (e) {
          console.warn("[GoogleSheets] Discovery URL load failed, trying name/version...");
        }

        if (!g.client.sheets) {
          await loadApi('sheets', 'v4');
        }

        if (g.client.sheets) {
          console.log("[GoogleSheets] Sheets API loaded manually.");
          return;
        }
      } catch (e) {
        console.error("[GoogleSheets] Manual load attempt failed:", e);
      }
    }
  }

  console.log("[GoogleSheets] Still waiting for Sheets API...");
  for (let i = 0; i < 100; i++) { // Wait up to 10 seconds
    await new Promise(resolve => setTimeout(resolve, 100));
    if ((window as any).gapi?.client?.sheets) {
      console.log("[GoogleSheets] Sheets API loaded successfully.");
      return;
    }
  }
  
  console.error("[GoogleSheets] Sheets API failed to load after 10s.");
  throw new Error("Sheets API not loaded");
}

// Clear cache on startup
clearHeaderCache();

/**
 * Fetches and caches the headers (row 1) of a specific sheet.
 */
async function getHeaders(sheetName: string): Promise<string[]> {
  if (!SPREADSHEET_ID) {
    console.error("[GoogleSheets] VITE_GOOGLE_SPREADSHEET_ID is not defined in environment variables.");
    return [];
  }

  if (headerCache.has(sheetName)) {
    return headerCache.get(sheetName)!;
  }

  try {
    await ensureSheetsApi();

    const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:1`,
    });

    const headers = response.result.values?.[0] || [];
    console.log(`[GoogleSheets] Headers for ${sheetName}:`, headers);
    // Debug: write headers to a file
    // (This is a hack, but I need to see the headers)
    // Actually, I cannot write to a file easily from here.
    // Let's try to throw an error with the headers.
    // throw new Error(`Headers for ${sheetName}: ${JSON.stringify(headers)}`);
    headerCache.set(sheetName, headers);
    return headers;
  } catch (error) {
    console.error(`[GoogleSheets] Error fetching headers for ${sheetName}:`, error);
    return [];
  }
}

/**
 * Normalizes a header string to a consistent key format (lowercase, trimmed, spaces to underscores).
 */
const normalizeKey = (key: string) => key.toLowerCase().trim().replace(/\s+/g, '_');

/**
 * Maps a raw sheet row array to a typed object based on headers.
 */
function rowToObject<T>(headers: string[], row: any[], rowIndex: number): T {
  const obj: any = { _rowIndex: rowIndex };
  
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeKey(header);
    let value = row[index];
    
    if (value === undefined || value === null || value === '') {
      obj[normalizedHeader] = null;
      return;
    }

    // Auto-deserializes JSON strings (arrays or objects)
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Fallback to original value if parsing fails
      }
    }

    // Convert boolean strings
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    // Convert numeric strings to numbers (except specific ID/status fields)
    const skipNumericConversion = ['id', 'user_id', 'sede', 'status'];
    if (
      !skipNumericConversion.includes(normalizedHeader) && 
      typeof value === 'string' && 
      !isNaN(Number(value)) && 
      value.trim() !== ''
    ) {
      value = Number(value);
    }

    obj[normalizedHeader] = value;
  });

  return obj as T;
}

/**
 * Maps an object to a raw sheet row array based on headers.
 */
function objectToRow(headers: string[], obj: any): any[] {
  return headers.map((header) => {
    const normalizedHeader = normalizeKey(header);
    const value = obj[normalizedHeader] ?? obj[header];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  });
}

/**
 * Retrieves the numeric sheetId for a given sheet name.
 */
async function getSheetId(sheetName: string): Promise<number> {
  try {
    await ensureSheetsApi();

    const response = await (window as any).gapi.client.sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = response.result.sheets?.find(
      (s: any) => s.properties.title === sheetName
    );

    if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
    return sheet.properties.sheetId;
  } catch (error) {
    console.error(`[GoogleSheets] Error fetching sheetId for ${sheetName}:`, error);
    throw new Error(`Failed to fetch sheetId for: ${sheetName}`);
  }
}

/**
 * Converts a 0-based column index to Excel-style letters (A, B, C... AA, AB...).
 */
function colIndexToLetter(index: number): string {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

/**
 * Reads all rows from a sheet and returns them as objects.
 * @param sheetName The name of the sheet to read.
 * @returns An array of objects representing the rows.
 */
export async function getSheetData<T>(sheetName: string): Promise<T[]> {
  try {
    const headers = await getHeaders(sheetName);
    if (headers.length === 0) {
      console.warn(`[GoogleSheets] No headers found for ${sheetName}, returning empty array.`);
      return [];
    }
    
    await ensureSheetsApi();

    const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:ZZ`,
    });

    const rows = response.result.values || [];
    console.log(`[GoogleSheets] Data for ${sheetName}:`, rows.length, "rows");
    return rows.map((row: any[], index: number) => 
      rowToObject<T>(headers, row, index + 2) // Row index starts at 2 (1-based, row 1 is headers)
    );
  } catch (error) {
    console.error(`[GoogleSheets] Error reading data for ${sheetName}:`, error);
    return [];
  }
}

/**
 * Appends a new record to the end of a sheet.
 * @param sheetName The name of the sheet.
 * @param record The object to append.
 */
export async function appendRow(sheetName: string, record: any): Promise<void> {
  console.log('[GoogleSheets] appendRow called:', sheetName, record);
  try {
    const headers = await getHeaders(sheetName);
    const row = objectToRow(headers, record);

    await ensureSheetsApi();

    const response = await (window as any).gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      resource: {
        values: [row],
      },
    });
    console.log('Sheets API response:', JSON.stringify(response));
    if (response.status !== 200) {
      throw new Error(`Sheets API error: ${response.statusText || 'Unknown error'}`);
    }
    console.log('[GoogleSheets] appendRow success');
  } catch (error) {
    console.error('[GoogleSheets] appendRow failed:', error);
    throw new Error(`Failed to append row to sheet: ${sheetName}`);
  }
}

/**
 * Updates specific fields in a row without overwriting the entire row.
 * @param sheetName The name of the sheet.
 * @param rowIndex The 1-based index of the row to update.
 * @param updates An object containing the fields to update.
 */
export async function updateRow(sheetName: string, rowIndex: number, updates: any): Promise<void> {
  try {
    const headers = await getHeaders(sheetName);
    const data = [];

    for (const [key, value] of Object.entries(updates)) {
      // Robust header matching using normalization
      const normalizedKey = normalizeKey(key);
      const colIndex = headers.findIndex(h => normalizeKey(h) === normalizedKey);
      
      if (colIndex === -1) {
        console.warn(`[GoogleSheets] Key '${key}' (normalized: '${normalizedKey}') not found in headers, skipping update for this field.`);
        continue;
      }

      const colLetter = colIndexToLetter(colIndex);
      let serializedValue = value;
      
      if (value !== null && value !== undefined && typeof value === 'object') {
        serializedValue = JSON.stringify(value);
      } else if (value === null || value === undefined) {
        serializedValue = '';
      }

      data.push({
        range: `${sheetName}!${colLetter}${rowIndex}`,
        values: [[serializedValue]],
      });
    }

    if (data.length === 0) return;
    
    await ensureSheetsApi();

    await (window as any).gapi.client.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        valueInputOption: 'RAW',
        data: data,
      },
    });
  } catch (error) {
    console.error(`[GoogleSheets] Error updating row ${rowIndex} in ${sheetName}:`, error);
    throw new Error(`Failed to update row ${rowIndex} in sheet: ${sheetName}`);
  }
}

/**
 * Deletes a row from a sheet using the deleteDimension request.
 * @param sheetName The name of the sheet.
 * @param rowIndex The 1-based index of the row to delete.
 */
export async function deleteRow(sheetName: string, rowIndex: number): Promise<void> {
  try {
    const sheetId = await getSheetId(sheetName);

    await ensureSheetsApi();

    await (window as any).gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error(`[GoogleSheets] Error deleting row ${rowIndex} from ${sheetName}:`, error);
    throw new Error(`Failed to delete row ${rowIndex} from sheet: ${sheetName}`);
  }
}

/**
 * Finds the 1-based row index of a record by its ID (searches column A).
 * @param sheetName The name of the sheet.
 * @param id The ID to search for.
 * @returns The 1-based row index or null if not found.
 */
export async function findRowIndex(sheetName: string, id: string | number): Promise<number | null> {
  try {
    await ensureSheetsApi();

    // Get headers to find the correct column for 'id'
    const headers = await getHeaders(sheetName);
    const idColIndex = headers.findIndex(h => normalizeKey(h) === 'id');
    const colLetter = idColIndex >= 0 ? colIndexToLetter(idColIndex) : 'A';

    console.log(`[GoogleSheets] findRowIndex: searching '${id}' in ${sheetName} column ${colLetter} (index ${idColIndex})`);

    const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${colLetter}:${colLetter}`,
    });

    const values = response.result.values || [];
    console.log(`[GoogleSheets] findRowIndex: found ${values.length} rows.`);
    
    // Debug: log the first 20 rows to see what's happening
    console.log(`[GoogleSheets] findRowIndex: first 20 rows:`, values.slice(0, 20).map((r: any[]) => r[0]));

    // Skip row 0 (header), find matching id
    for (let i = 1; i < values.length; i++) {
      const cellValue = values[i][0];
      if (String(cellValue) === String(id)) {
        console.log(`[GoogleSheets] findRowIndex: found at row ${i + 1}`);
        return i + 1; // 1-based row index
      }
    }

    console.warn(`[GoogleSheets] findRowIndex: ID '${id}' not found. Searched ${values.length} rows.`);
    return null;
  } catch (error) {
    console.error(`[GoogleSheets] Error in findRowIndex for ID ${id} in ${sheetName}:`, error);
    throw new Error(`Failed to find row index in sheet: ${sheetName}`);
  }
}

/**
 * Clears the header cache for a specific sheet or all sheets.
 * @param sheetName Optional sheet name to clear.
 */
export function clearHeaderCache(sheetName?: string): void {
  if (sheetName) {
    headerCache.delete(sheetName);
  } else {
    headerCache.clear();
  }
}

export async function diagnoseSheetsConnection(): Promise<void> {
  const g = (window as any).gapi;
  
  const result: Record<string, any> = {
    '1_gapi_exists': !!g,
    '2_gapi_client_exists': !!g?.client,
    '3_sheets_exists': !!g?.client?.sheets,
    '4_calendar_exists': !!g?.client?.calendar,
    '5_spreadsheet_id': import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || 'NOT SET',
    '6_token': localStorage.getItem('leadomancy_access_token') ? 'EXISTS (first 20 chars: ' + localStorage.getItem('leadomancy_access_token')!.slice(0,20) + ')' : 'NOT FOUND',
  };

  // Try a direct fetch to Sheets API without gapi
  const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
  const token = localStorage.getItem('leadomancy_access_token');
  
  if (spreadsheetId && token) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/notizie!A1:Z5?key=`;
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      result['7_direct_fetch_status'] = resp.status;
      result['8_direct_fetch_data'] = JSON.stringify(data).slice(0, 300);
    } catch(e: any) {
      result['7_direct_fetch_error'] = e.message;
    }
  } else {
    result['7_direct_fetch'] = 'SKIPPED - missing spreadsheetId or token';
  }

  console.log('=== DIAGNOSIS ===', result);
  alert(JSON.stringify(result, null, 2));
}
