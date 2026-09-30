import { getCurrentTenant } from '../utils/tenantHelper';
import { db } from '../firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
import { useManagerStore } from '../store/managerStore';

/**
 * Przetwarza surowy tekst z notatki technika i rozbija go na ustrukturyzowane dane
 * (notatka, przepracowane godziny, akcje do podjęcia w przyszłości) przy użyciu AI.
 */
export async function extractServiceDataWithAI(rawText) {
  const apiKey = useManagerStore.getState().groqApiKey;
  if (!apiKey) {
    throw new Error('Brak klucza API Groq w ustawieniach.');
  }

  const prompt = `
Jesteś asystentem utrzymania ruchu. Otrzymasz surowy tekst (często z dyktowania) od mechanika po zakończeniu serwisu.
Twoim zadaniem jest wyciągnąć z niego strukturalne informacje i zwrócić w formacie JSON.

Oto co masz wyciągnąć:
1. "note" (string): Profesjonalnie zredagowana, czysta notatka techniczna z tego co zostało zrobione. (Bez wzmianek o czasie i bez zadania na przyszłość - tylko wykonana praca).
2. "timeSpentHours" (number | null): Czas pracy w godzinach (np. "zeszło mi dwie godziny" -> 2). Jeśli brak informacji, zwróć null.
3. "actionItem" (string | null): Jeśli mechanik mówi o jakiejś rzeczy do zrobienia w przyszłości (np. "trzeba sprawdzić luzy", "zamówić filtr"), wpisz to tu. Jeśli brak, null.
4. "actionItemDays" (number | null): Jeśli wspomniano kiedy to zrobić (np. "za tydzień" -> 7, "za miesiąc" -> 30). Domyślnie 7 jeśli jest akcja ale brak czasu. Jeśli brak akcji, null.

Zwróć TYLKO poprawny kod JSON. Żadnych wstępów, form przywitania.

Przykład wejścia: "Wymieniłem łożysko, zeszło mi dwie godziny, użyłem smaru litowego, trzeba sprawdzić luzy za tydzień"
Przykład wyjścia:
{
  "note": "Wymieniono łożysko główne. Zastosowano smar litowy.",
  "timeSpentHours": 2,
  "actionItem": "Sprawdzić luzy robocze",
  "actionItemDays": 7
}

TEKST OD MECHANIKA:
"${rawText}"
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-2.5-32b', // Llama-3 / qwen na groq świetnie radzi sobie z JSONem i Polskim
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Błąd API AI');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Log token usage
  const tokens = data.usage?.total_tokens || 0;
  if (tokens > 0) {
    const tenantId = getCurrentTenant();
    if (tenantId) {
      setDoc(doc(db, 'tenants', tenantId, 'stats', 'ai_usage'), {
        groqTokens: increment(tokens)
      }, { merge: true }).catch(err => console.error('Token tracking error:', err));
    }
  }

  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch(e) {
    throw new Error('Błąd parsowania JSON z odpowiedzi AI: ' + content);
  }
}
