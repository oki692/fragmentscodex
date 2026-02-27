# Dokumentacja Zmian - Model Selector UI

Niniejszy dokument opisuje modyfikacje wprowadzone w komponencie wyboru modelu językowego, mające na celu uzyskanie wyglądu 1:1 z dostarczonym wzorem.

## 1. Przegląd Zmian

Głównym celem było uproszczenie interfejsu użytkownika poprzez usunięcie zbędnych elementów wizualnych oraz wdrożenie specyficznego systemu stylizacji opartego na dostarczonych plikach źródłowych.

| Element | Stan Pierwotny | Stan Po Zmianach |
| :--- | :--- | :--- |
| **Logotypy** | Ikony dostawców (OpenAI, Anthropic itp.) | **Usunięte** (czysty tekst) |
| **Grupowanie** | Podział na sekcje według dostawców | **Usunięte** (płaska lista) |
| **Persona** | Wybór szablonów (Auto, Code itp.) | **Usunięte** (tylko wybór modelu) |
| **Design Listy** | Standardowy styl Shadcn UI | **Customowy design 1:1** (zaokrąglenia 16px) |
| **Trigger** | Przycisk z obramowaniem | **Minimalistyczny tekst** (font-size: xs) |

## 2. Szczegóły Techniczne

### Stylizacja (CSS Modules & Variables)
Wprowadzono dedykowany system zmiennych CSS w `globals.css` oraz arkusz stylów `Menu.module.css`, który definiuje:
*   **Animacje**: Płynne skalowanie (`scale(0.95) -> scale(1)`) i przenikanie przy otwieraniu.
*   **Geometrię**: `border-radius: 16px` dla kontenera listy oraz `12px` dla poszczególnych elementów.
*   **Interakcje**: Specyficzne kolory tła dla stanów `:hover` i `:focus` (`#f3f4f6` w trybie jasnym, `#2a2a2a` w trybie ciemnym).

### Struktura Komponentów
Zmodyfikowano plik `components/ui/select.tsx`, aby odzwierciedlał strukturę `MenuItem` -> `PressableInner`.

```tsx
// Przykład nowej struktury elementu listy
<SelectItem className={s.MenuItem}>
  <div className={s.PressableInner}>
    {modelName}
  </div>
</SelectItem>
```

## 3. Pliki Podlegające Zmianom

1.  `components/chat-picker.tsx`: Logika wyświetlania płaskiej listy modeli.
2.  `components/ui/select.tsx`: Implementacja struktury wizualnej 1:1.
3.  `components/ui/Menu.module.css`: Definicje stylów i animacji.
4.  `app/globals.css`: Globalne zmienne systemowe dla nowego designu.

---
*Zmiany zostały wdrożone i są widoczne w środowisku uruchomieniowym.*
